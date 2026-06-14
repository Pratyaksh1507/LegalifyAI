import { OpenAI } from "openai";
import { checkAndDeductQuota } from "@/lib/quota-server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Exponential backoff retry for NVIDIA 503 (model loading)
async function withRetry(fn, retries = 2, delays = [4000, 10000]) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const is503 = err?.status === 503 || err?.message?.includes("503");
      if (is503 && i < retries) {
        console.warn(`[Draft API] 503 received. Retry ${i + 1}/${retries} in ${delays[i]}ms...`);
        await new Promise((r) => setTimeout(r, delays[i]));
        continue;
      }
      throw err;
    }
  }
}

export async function POST(req) {
  const requestId = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const startTime = Date.now();

  try {
    const cloned = req.clone();
    const { facts, language, useBNS } = await cloned.json();

    if (!facts) {
      return new Response(
        JSON.stringify({ error: "Facts are required to draft" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Auth + quota check
    const quotaResult = await checkAndDeductQuota(req);
    if (quotaResult.error) return quotaResult.error;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OPENROUTER_API_KEY is not configured in .env.local" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const model = "nex-agi/nex-n2-pro:free";

    const systemPrompt = `You are an expert Indian Legal Draftsman. Draft a concise, court-ready legal document based on the user's provided facts.

STRICT DOCUMENT STRUCTURE — Follow this template exactly, keep each section brief:

IN THE HON'BLE {court_name}
AT {court_location}

{petition_type}

In the matter of:

{petitioner_name} ... Petitioner/Appellant
versus
{respondent_name} ... Respondent

MOST RESPECTFULLY SHOWETH:

1. BRIEF FACTS:
[2–4 sentences summarising the key facts]

2. GROUNDS:
A. [First legal ground with applicable provision]
B. [Second legal ground]
C. [Additional grounds as needed — maximum 4 grounds total]

3. LEGAL PROVISIONS RELIED UPON:
[List sections and acts — bullet points, no long explanations]

4. PRAYER:
In view of the above, it is most respectfully prayed that this Hon'ble Court may be pleased to:
(a) [Primary relief]
(b) [Alternative relief]
(c) Pass any other order as this Court may deem fit and proper in the circumstances of the case.

And for this act of kindness, the Petitioner/Appellant shall, as in duty bound, ever pray.

Place: {place}
Date: {date}

Through Counsel
{advocate_name}
Advocate for the Petitioner/Appellant
Enrol. No.: {enrolment_number}

VERIFICATION:
I, {petitioner_name}, the above-named Petitioner, do hereby verify that the contents of the above petition are true and correct to the best of my knowledge and belief and nothing material has been concealed therefrom.

Verified at {place} on this {date}.

{petitioner_name}
(Petitioner/Appellant)

---

RULES:
- Use formal legal terminology appropriate for Indian courts.
- Draft in ${language}.
- Fill in all known details. Use placeholders like {court_name}, {petitioner_name} etc. for missing details.
- Be concise. Do NOT pad sections. Do NOT add commentary or explanations outside the document.
- Stop immediately after the Verification section.`;

    const finalSystemPrompt = useBNS
      ? systemPrompt +
        "\n- Apply the new criminal laws: Bharatiya Nyaya Sanhita (BNS), Bharatiya Nagarik Suraksha Sanhita (BNSS), and Bharatiya Sakshya Adhiniyam (BSA) where applicable, rather than IPC, CrPC, or IEA."
      : systemPrompt;

    // AbortController to actually kill the upstream NVIDIA request on timeout
    const abortController = new AbortController();
    const timeoutHandle = setTimeout(() => {
      console.warn(`[Draft API] Hard timeout reached for ${requestId}. Aborting upstream stream.`);
      abortController.abort();
    }, 55000); // 55 second hard limit

    const client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
    });

    const createStream = () =>
      client.chat.completions.create(
        {
          model,
          messages: [
            { role: "system", content: finalSystemPrompt },
            { role: "user", content: `Here are the facts for the draft:\n\n${facts}` },
          ],
          temperature: 0.5,
          top_p: 0.9,
          max_tokens: 2500, // Court petitions are ~800-1200 tokens; 2500 is a safe ceiling
          stream: true,
        },
        { signal: abortController.signal },
      );

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
          if (err.name === "AbortError" || abortController.signal.aborted) {
            controller.enqueue(
              encoder.encode(
                "\n\n[⚠️ Generation timed out after 45 seconds. The document has been partially generated above. Try again with shorter facts.]",
              ),
            );
          } else {
            console.error("[Draft API] Stream error:", err);
            controller.enqueue(encoder.encode(`\n\n[Error: ${err.message}]`));
          }
        } finally {
          clearTimeout(timeoutHandle);
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
    console.error("[Draft API] Error:", error);
    const status = error.status || 500;
    const message = error.message || "Failed to generate draft.";
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: {
        "Content-Type": "application/json",
        "X-Request-Id": requestId,
      },
    });
  }
}
