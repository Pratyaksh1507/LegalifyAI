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
        console.warn(`[Review API] 503 received. Retry ${i + 1}/${retries} in ${delays[i]}ms...`);
        await new Promise((r) => setTimeout(r, delays[i]));
        continue;
      }
      throw err;
    }
  }
}

const SYSTEM_PROMPT = `You are an expert Indian Legal Document Reviewer with deep expertise in Indian law. Analyze the provided legal document text CAREFULLY and THOROUGHLY.

Take your time to analyze EVERY clause, EVERY sentence, and EVERY potential issue. Do NOT rush. A thorough review is critical.

Your response MUST follow this exact structure, with clear section markers:

==== SUMMARY ====
Provide a DETAILED 3-5 paragraph overall assessment. Include:
- A risk score from 0-100 (0 = very safe, 100 = extremely risky)
- Key findings and overall document health
- Recommendations for improvement

==== ISSUES ====
List ALL issues found - be exhaustive and systematic. For each issue:

ISSUE_START
SEVERITY: [HIGH/MEDIUM/LOW]
TYPE: [risk_clause|missing_protection|grammar|compliance|ambiguity|unfavorable_term|missing_clause]
ORIGINAL_TEXT: [exact problematic text]
SUGGESTED_TEXT: [suggested fix]
EXPLANATION: [why this is an issue and its potential legal consequences]
ISSUE_END=

==== REDLINED ====
Provide a redlined version of the FULL original document with ALL changes tracked inline. Use this exact format:
- For text that should be REMOVED: wrap in {{DEL}}text to remove{{/DEL}}
- For text that should be ADDED as replacement: wrap in {{ADD}}suggested replacement text{{/ADD}}
- Show the replacement IMMEDIATELY after the deletion, like: {{DEL}}old text{{/DEL}}{{ADD}}new text{{/ADD}}
- Keep ALL unchanged text exactly as-is.
- You MUST include the full document, not just snippets.
- EVERY issue listed in the ISSUES section MUST be reflected in this redlined version.

Example:
Original: "The contractor shall pay 100 dollars."
Redlined: "The contractor shall {{DEL}}pay 100 dollars{{/DEL}}{{ADD}}pay 500 rupees{{/ADD}}."

CRITICAL: Be exhaustive. Check for:
- Illegal or non-compliant clauses
- Missing standard protections
- Ambiguous language that could cause disputes
- Unfavorable terms
- Grammar and formatting issues
- Missing clauses that should be present
- Jurisdiction and governing law issues
- Termination and liability clauses
- Payment and penalty terms

IMPORTANT: Do NOT skip any issues. A thorough review takes time - analyze carefully.`;

export async function POST(req) {
  const requestId = `review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const startTime = Date.now();

  try {
    const cloned = req.clone();
    const { text, filename, instructions } = await cloned.json();

    if (!text) {
      return new Response(JSON.stringify({ error: "No document text provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Auth + quota check
    const quotaResult = await checkAndDeductQuota(req);
    if (quotaResult.error) return quotaResult.error;

    // Smart truncation: keep first 12000 + last 8000 for more thorough review
    const maxChars = 20000;
    let truncatedText = text;
    if (text.length > maxChars) {
      const firstPart = text.slice(0, 12000);
      const lastPart = text.slice(-8000);
      truncatedText = firstPart + "\n\n[... document truncated for processing ...]\n\n" + lastPart;
    }

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "NVIDIA_API_KEY is not configured." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const model = process.env.NVIDIA_MODEL || "meta/llama-3.3-70b-instruct";

    const client = new OpenAI({
      baseURL: "https://integrate.api.nvidia.com/v1",
      apiKey: apiKey,
    });

    const prompt = `${SYSTEM_PROMPT}\n\nUser: ${instructions ? `Additional instructions: ${instructions}\n\n---\n\n` : ""}${truncatedText}`;

    const encoder = new TextEncoder();
    const createStream = () => client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 16384,
      temperature: 0.3,
      stream: true,
    });

    const stream = await withRetry(createStream);

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) controller.enqueue(encoder.encode(content));
          }
        } catch (err) {
          console.error("[Review API] Stream error:", err);
          controller.enqueue(encoder.encode(`\n\n[Error: ${err.message}]`));
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
      },
    });
  } catch (error) {
    console.error("[Review API] Error:", error);
    const status = error.status || 500;
    const message = error.message || "Failed to process document review.";
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: {
        "Content-Type": "application/json",
        "X-Request-Id": requestId,
      },
    });
  }
}
