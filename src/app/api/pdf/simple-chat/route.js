import { OpenAI } from "openai";
import { checkAndDeductQuota } from "@/lib/quota-server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Exponential backoff retry for NVIDIA 503 (model loading)
async function withRetry(fn, retries = 3, delays = [5000, 15000, 30000]) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const is503 = err?.status === 503 || err?.message?.includes("503");
      if (is503 && i < retries) {
        console.warn(`[PDF Chat API] 503 received. Retry ${i + 1}/${retries} in ${delays[i]}ms...`);
        await new Promise((r) => setTimeout(r, delays[i]));
        continue;
      }
      throw err;
    }
  }
}

/**
 * BM25-style TF-IDF ranking for chunk selection.
 * Scores each chunk by how often query terms appear (TF),
 * weighted by how rare the term is across all chunks (IDF).
 * Rare legal terms (e.g., "indemnification", "arbitration") get higher weight.
 */
function rankChunksBM25(query, chunks) {
  const q = query.toLowerCase();
  const queryTerms = q
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => w.replace(/[^a-z0-9]/g, ""));

  if (queryTerms.length === 0) return chunks;

  const N = chunks.length;

  // Compute document frequency for each term
  const df = {};
  for (const term of queryTerms) {
    df[term] = 0;
    for (const chunk of chunks) {
      if (chunk.toLowerCase().includes(term)) df[term]++;
    }
  }

  // BM25 parameters
  const k1 = 1.5;
  const b = 0.75;
  const avgLen = chunks.reduce((s, c) => s + c.length, 0) / (N || 1);

  const scored = chunks.map((chunk, idx) => {
    const lowerChunk = chunk.toLowerCase();
    const D = chunk.length;
    let score = 0;

    for (const term of queryTerms) {
      const tfRaw = (lowerChunk.match(new RegExp(term, "g")) || []).length;
      const tf = (tfRaw * (k1 + 1)) / (tfRaw + k1 * (1 - b + b * (D / avgLen)));
      const idf = Math.log((N - (df[term] || 0) + 0.5) / ((df[term] || 0) + 0.5) + 1);
      score += tf * idf;
    }

    // Exact phrase boost: if query (or 4+ word sub-phrase) appears verbatim, heavily boost
    if (q.length > 10 && lowerChunk.includes(q.slice(0, Math.min(q.length, 40)))) {
      score *= 3;
    }

    return { chunk, score, idx };
  });

  return scored.sort((a, b) => b.score - a.score);
}

/**
 * Adaptive context selection using BM25 ranking.
 * Supports global summary mode and specific query mode.
 */
function getAdaptiveContext(query, text) {
  const q = query.toLowerCase();
  const globalKeywords = [
    "summarize", "summary", "overview", "key points",
    "whole document", "entire", "brief me", "what is this about",
    "tell me about", "describe this"
  ];
  const isGlobalRequest = globalKeywords.some((word) => q.includes(word));

  if (isGlobalRequest) {
    console.log("[PDF Chat] Global Summary Mode — sending first 320k chars.");
    return { context: text.slice(0, 320000), mode: "summary" };
  }

  console.log("[PDF Chat] Specific Query Mode — BM25 chunk ranking.");
  const rawChunks = text.split(/--- PAGE \d+ ---/).filter((c) => c.trim().length > 0);

  // Also preserve page numbers for citation
  const pageChunks = [];
  const pageRegex = /--- PAGE (\d+) ---/g;
  let match;
  let lastIndex = 0;
  let lastPage = 0;

  // Re-split with page numbers preserved
  const lines = text.split("\n");
  let currentPage = 0;
  let currentChunk = "";
  const paged = []; // { page, text }

  for (const line of lines) {
    const pm = line.match(/^--- PAGE (\d+) ---$/);
    if (pm) {
      if (currentChunk.trim()) paged.push({ page: currentPage, text: currentChunk });
      currentPage = parseInt(pm[1], 10);
      currentChunk = "";
    } else {
      currentChunk += line + "\n";
    }
  }
  if (currentChunk.trim()) paged.push({ page: currentPage, text: currentChunk });

  const chunks = paged.length > 0 ? paged.map((p) => p.text) : rawChunks;
  const pages = paged.length > 0 ? paged.map((p) => p.page) : rawChunks.map((_, i) => i + 1);

  const ranked = rankChunksBM25(query, chunks);

  // Score threshold: if best score < 0.5, it's likely not in the document
  const bestScore = ranked[0]?.score ?? 0;
  const lowConfidence = bestScore < 0.5;

  let context = "";
  let citedPages = [];
  let currentLength = 0;
  const MAX_CONTEXT = 40000; // Increased from 25,000

  for (const item of ranked) {
    if (currentLength + item.chunk.length > MAX_CONTEXT) break;
    const pageNum = pages[item.idx] || item.idx + 1;
    context += `--- PAGE ${pageNum} ---\n${item.chunk}\n\n`;
    citedPages.push(pageNum);
    currentLength += item.chunk.length;
  }

  return {
    context: context || (paged.length > 0 ? paged.slice(0, 5).map((p) => `--- PAGE ${p.page} ---\n${p.text}`).join("\n") : rawChunks.slice(0, 5).join("\n\n")),
    mode: "specific",
    lowConfidence,
    citedPages: [...new Set(citedPages)].sort((a, b) => a - b),
  };
}

export async function POST(req) {
  const requestId = `pdfchat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const startTime = Date.now();

  try {
    const cloned = req.clone();
    const { question, fullText, history = [], filename } = await cloned.json();

    if (!question || !fullText) {
      return new Response(JSON.stringify({ error: "Missing question or text" }), { status: 400 });
    }

    // Auth + quota check
    const quotaResult = await checkAndDeductQuota(req);
    if (quotaResult.error) return quotaResult.error;

    const nvidiaApiKey = process.env.NVIDIA_API_KEY;
    if (!nvidiaApiKey) {
      return new Response(JSON.stringify({ error: "NVIDIA_API_KEY not set" }), { status: 500 });
    }

    // 1. Adaptive context with BM25 ranking
    const { context, mode: contextMode, lowConfidence, citedPages = [] } = getAdaptiveContext(question, fullText);

    // 2. Prune history (last 3 exchanges = 6 messages)
    const prunedHistory = history.slice(-6);

    const client = new OpenAI({
      baseURL: "https://integrate.api.nvidia.com/v1",
      apiKey: nvidiaApiKey,
    });

    const model = process.env.NVIDIA_MODEL || "meta/llama-3.3-70b-instruct";
    const isSummary = contextMode === "summary";

    const systemPrompt = `You are Legalify AI, an expert legal document analyst. You are analyzing the document: "${filename}".

${isSummary
  ? `TASK: The user wants a COMPREHENSIVE SUMMARY. Structure your summary with:
## Document Overview
## Parties Involved
## Key Obligations
## Important Dates & Deadlines
## Termination & Exit Clauses
## Risks & Liabilities
## Governing Law & Jurisdiction`
  : `TASK: The user has a SPECIFIC QUESTION. Answer it directly and concisely based on the document context below.`}

MANDATORY GROUNDING RULES:
1. **Always quote the specific clause, section, or provision text** from the document when answering. Format quotes like: > "exact text from document" — *Page X*
2. **Always cite the page number** where you found the answer using the --- PAGE N --- markers in the context.
3. **If the answer is not present in the provided context**, you MUST respond with: "⚠️ This information is not present in the document. The document does not appear to contain details about [topic]."
4. Do NOT use your general knowledge to answer questions about what the document says. Only use the provided document context.
5. Use professional legal terminology.
${lowConfidence ? "6. Note: The retrieved context may not contain the answer. If uncertain, state that clearly." : ""}

DOCUMENT CONTEXT:
${context}`;

    const createStream = () =>
      client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...prunedHistory,
          { role: "user", content: question },
        ],
        stream: true,
        max_tokens: isSummary ? 4096 : 2048,
        temperature: 0.1,
      });

    const stream = await withRetry(createStream);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send page citation metadata as a prefixed JSON line
          // The client can strip this to render citations
          if (citedPages.length > 0 && !isSummary) {
            const meta = `\x00CITATIONS:${JSON.stringify(citedPages)}\x00`;
            controller.enqueue(encoder.encode(meta));
          }
          for await (const chunk of stream) {
            const choices = chunk.choices;
            if (!choices || choices.length === 0) continue;
            const content = choices[0].delta?.content || "";
            if (content) controller.enqueue(encoder.encode(content));
          }
        } catch (err) {
          console.error("[PDF Chat API] Stream error:", err);
          controller.enqueue(
            encoder.encode("\n\n[Error: The chat stream was interrupted.]"),
          );
        } finally {
          controller.close();
        }
      },
    });

    const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Request-Id": requestId,
        "X-Generation-Time": `${generationTime}s`,
        "X-Model-Used": model,
        "X-Cited-Pages": citedPages.join(","),
      },
    });
  } catch (error) {
    console.error("[PDF Chat API] Top-level error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process PDF chat query.", details: error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "X-Request-Id": requestId,
        },
      }
    );
  }
}
