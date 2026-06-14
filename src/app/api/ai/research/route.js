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
        console.warn(`[Research API] 503 received. Retry ${i + 1}/${retries} in ${delays[i]}ms...`);
        await new Promise((r) => setTimeout(r, delays[i]));
        continue;
      }
      throw err;
    }
  }
}

export async function POST(req) {
  const requestId = `research-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const startTime = Date.now();

  try {
    const cloned = req.clone();
    const body = await cloned.json().catch(() => ({}));
    const { query } = body;

    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Auth + quota check
    const quotaResult = await checkAndDeductQuota(req);
    if (quotaResult.error) return quotaResult.error;

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "NVIDIA_API_KEY is not configured." }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const model = process.env.NVIDIA_MODEL || "meta/llama-3.3-70b-instruct";

    const client = new OpenAI({
      baseURL: "https://integrate.api.nvidia.com/v1",
      apiKey: apiKey,
    });

    const systemPrompt = `You are an authoritative Indian Legal Research AI with expert-level knowledge of Indian statutes, constitutional law, and Supreme Court / High Court jurisprudence.

RESPONSE FORMAT — Always structure your answer exactly as follows (use Markdown headers):

## Legal Principle
State the core legal principle(s) applicable to the query in 2–4 sentences.

## Applicable Statutes & Sections
List every relevant statute with the exact section number and its text or a precise paraphrase:
- **Section [X], [Full Act Name, Year]** — [What the section says and how it applies]
- (Example: **Section 138, Negotiable Instruments Act, 1881** — Dishonour of cheques for insufficiency of funds is a criminal offence punishable with imprisonment up to 2 years or fine up to twice the cheque amount or both.)

## Landmark Cases
Cite at least 3 specific, real judgments with full citation:
### [Case Name] [(Year) Volume SCC/SCR/AIR PageNo]
- **Court:** [e.g., Supreme Court of India / Delhi High Court]
- **Held:** [Precise ratio decidendi in 1–2 sentences]
- **Relevance:** [How this case applies to the query]

## Practical Implications
Explain what this means in practice — procedural steps, limitation periods, remedies available, and strategic considerations for legal practitioners.

---

MANDATORY RULES:
1. Every statute citation MUST include the section number and full act name with year (e.g., "Section 302, Indian Penal Code, 1860" or "Section 9, Arbitration and Conciliation Act, 1996").
2. Every case citation MUST include the party names, year, reporter, and volume (e.g., "Vishaka v. State of Rajasthan, (1997) 6 SCC 241").
3. If BNS/BNSS/BSA are applicable (post-2023 criminal matters), cite those instead of IPC/CrPC/IEA.
4. NEVER use generic disclaimers like "you should consult a lawyer," "seek legal advice," or "I am an AI." Provide the legal answer directly and authoritatively.
5. If a fact-specific query is asked (involving specific names, dates, or amounts), clearly distinguish the general legal principle from what applies to the specific facts.
6. Use precise legal terminology. Do not simplify or paraphrase statutes beyond what is necessary for clarity.`;

    const createStream = () =>
      client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
        max_tokens: 16384,
        temperature: 0.1,
        stream: true,
      });

    const stream = await withRetry(createStream);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) controller.enqueue(encoder.encode(content));
          }
        } catch (err) {
          console.error("[Research API] Stream error:", err);
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
    console.error("[Research API] Error:", error);
    const status = error.status || 500;
    const message = error.message || "Failed to process research query.";
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: {
        "Content-Type": "application/json",
        "X-Request-Id": requestId,
      },
    });
  }
}
