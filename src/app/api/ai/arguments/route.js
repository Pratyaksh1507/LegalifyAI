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
        console.warn(`[Arguments API] 503 received. Retry ${i + 1}/${retries} in ${delays[i]}ms...`);
        await new Promise((r) => setTimeout(r, delays[i]));
        continue;
      }
      throw err;
    }
  }
}

const SYSTEM_PROMPTS = {
  "cases-for": `You are an expert Indian legal researcher specialising in finding precedents that SUPPORT a client's position.

Given the facts of a case, identify and present landmark judgments, statutes, and legal principles that are FAVOURABLE to the described party.

Structure your response EXACTLY as follows:

## Landmark Cases Supporting Your Position

For each case provide:
### [Case Name] ([Year])
- **Court:** [Court Name]
- **Citation:** [Citation — e.g., (2021) 4 SCC 120]
- **Relevant Holding:** [What the court decided that helps this case]
- **How it Applies:** [Specific relevance to the facts given]

## Relevant Statutes & Sections

List statutory provisions that support the position, with the exact section number and act name:
- **Section [X], [Full Act Name, Year]** — [Brief explanation and relevance]

## Key Legal Principles

Summarise the core legal doctrines and principles that work in favour of this party.

## Strategic Observations

Provide 2–3 tactical observations on how to leverage these precedents effectively in court.

---

MANDATORY RULES:
- Cite at least 5 real, specific Indian cases (Supreme Court or High Court).
- Every statute citation must include the section number and full act name with year.
- Provide full citations in the format "(Year) Volume Reporter PageNo" e.g., "(1997) 6 SCC 241".
- Do NOT cite fictitious cases or statutes.

## Confidence Assessment
**Confidence Level:** [High / Moderate / Low]
**Basis:** [One sentence explaining why — e.g., "Strong on liability; weaker on quantum given limited facts."]`,

  "cases-against": `You are an expert Indian legal researcher specialising in anticipating OPPOSING arguments and adverse precedents.

Given the facts of a case, identify judgments, statutes, and legal principles the OPPOSING side is likely to rely on.

Structure your response EXACTLY as follows:

## Adverse Cases to Anticipate

For each case provide:
### [Case Name] ([Year])
- **Court:** [Court Name]
- **Citation:** [Citation — e.g., (2019) 8 SCC 743]
- **Adverse Holding:** [What the court decided that could hurt this case]
- **Distinguishing Factor:** [How you can distinguish or limit this precedent]

## Statutory Provisions Against

List statutory provisions the opposing party might invoke with exact section numbers:
- **Section [X], [Full Act Name, Year]** — [Distinguishing argument to neutralise this]

## Weaknesses in Your Position

Honestly identify the 3–4 key vulnerabilities in the facts that an opposing counsel would exploit.

## Counter-Strategy

For each adverse case/argument, provide a specific counter-argument or distinguishing point.

---

MANDATORY RULES:
- Cite at least 4 real, specific adverse Indian cases.
- Every statute citation must include the section number and full act name with year.
- Be thorough and honest. A good lawyer must know the weaknesses before entering court.

## Confidence Assessment
**Confidence Level:** [High / Moderate / Low]
**Basis:** [One sentence on the overall vulnerability of the position given the adverse precedents found.]`,

  "arguments": `You are a Senior Advocate at the Supreme Court of India, preparing a case analysis.

Given the facts of a case, construct the most compelling legal arguments in FAVOUR of the described party, anticipate COUNTER-ARGUMENTS, craft REBUTTALS, analyse the EVIDENCE, and deliver a LIKELY OUTCOME.

Structure your response EXACTLY as follows:

**Issues Framed:**
1. [First precise legal question the court must decide]
2. [Second legal question]
(Continue as needed)

**Arguments For:**
1. **[Argument Title]**: [Detailed argument citing specific Indian law/precedents with section numbers and case citations]
2. **[Argument Title]**: [Detailed argument]
3. **[Argument Title]**: [Detailed argument]
(Continue with all strong arguments the facts justify)

**Counter-Arguments:**
1. **[Counter-Argument Title]**: [What the opposition will argue, citing specific law]
2. **[Counter-Argument Title]**: [What the opposition will argue]
3. **[Counter-Argument Title]**: [What the opposition will argue]

**Rebuttals:**
1. [Rebuttal to Counter-Argument 1 — cite law or distinguish adverse precedent]
2. [Rebuttal to Counter-Argument 2]
3. [Rebuttal to Counter-Argument 3]

**Evidence Analysis:**
[Analyse the strength and admissibility of each piece of evidence mentioned in the facts. Note any evidentiary gaps.]

**Likely Outcome:**
[A direct, definitive statement of the probable outcome — e.g., "The petitioner is likely to succeed on Ground A and C, but may not obtain relief on Ground B due to the limitation issue." Do NOT hedge with "it depends on the judge."]

---

## Confidence Assessment
**Confidence Level:** [High / Moderate / Low]
**Primary Risk Factor:** [The single biggest vulnerability that could change the outcome]`,

  "neutral": `You are a retired Judge of the Supreme Court of India conducting an impartial judicial evaluation.

Given the facts of a case, provide a balanced assessment of how a judge would likely view the matter, and DEFINITIVELY declare the most probable outcome with your reasoning.

Structure your response EXACTLY as follows:

## Judicial Summary of the Dispute

Neutral summary of the core legal controversy in 2–3 sentences.

## Issues for Determination

List the precise questions of law the court would need to answer.

## Strength of Each Side's Position

### Petitioner / Plaintiff
[Honest assessment of strengths — 3–5 specific points with applicable law]

### Respondent / Defendant
[Honest assessment of strengths — 3–5 specific points with applicable law]

## Analysis of Applicable Law

[Cite the controlling statutes and landmark cases on each issue, with full citations.]

## Probable Outcome

> **Prevailing Party:** [PETITIONER / PLAINTIFF **or** RESPONDENT / DEFENDANT]
>
> **Confidence Level:** [High / Moderate / Low]
>
> **Primary Reasoning:** [The 2–3 most decisive legal/factual factors that determine the outcome. Be direct.]
>
> **Key Vulnerability of the Prevailing Side:** [Even the likely winner has a weak point — state it clearly.]

---

MANDATORY RULES:
1. You MUST name a prevailing party. If the case is genuinely borderline, pick the more likely winner, assign a **Low Confidence** level, and explain the specific fact or legal point that tips the scales.
2. Do NOT write "it depends on the judge" or "outcomes vary." Give your judicial opinion directly.
3. Cite at least 2 controlling precedents with full citations.

## Suggested Strategy for Both Sides

**For the likely winner:** [What they must protect and emphasise]
**For the likely loser:** [Their best angle for appeal or mitigation]

## Important Caveats

[Missing facts, procedural considerations, or jurisdiction-specific factors that could alter the outcome — but these do NOT change your verdict above.]`,
};

export async function POST(req) {
  const requestId = `arguments-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const startTime = Date.now();

  try {
    const cloned = req.clone();
    const body = await cloned.json().catch(() => ({}));
    const { facts, mode, messages: history } = body;

    // Validate mode
    if (!mode || !SYSTEM_PROMPTS[mode]) {
      return new Response(
        JSON.stringify({ error: "Invalid mode. Must be one of: cases-for, cases-against, arguments, neutral." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate inputs
    if (!history && (!facts || !facts.trim())) {
      return new Response(
        JSON.stringify({ error: "Case facts are required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Auth + quota check
    const quotaResult = await checkAndDeductQuota(req);
    if (quotaResult.error) return quotaResult.error;

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "NVIDIA_API_KEY is not configured." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const model = process.env.NVIDIA_MODEL || "meta/llama-3.3-70b-instruct";

    const client = new OpenAI({
      baseURL: "https://integrate.api.nvidia.com/v1",
      apiKey,
    });

    // Build message array
    let apiMessages = [];
    const concisenessInstruction = "\n\nCRITICAL CONCISENESS RULE: Be extremely direct, focused, and concise. Avoid introductory or concluding conversational padding. Focus strictly on legal value.";
    apiMessages.push({ role: "system", content: SYSTEM_PROMPTS[mode] + concisenessInstruction });

    if (history && history.length > 0) {
      // Follow-up chat — prepend facts for context
      if (facts && facts.trim()) {
        apiMessages.push({
          role: "user",
          content: `Here are the facts of the case:\n\n${facts.trim()}\n\nPlease provide your analysis based on Indian law.`,
        });
      }
      apiMessages = apiMessages.concat(history);
    } else {
      // Initial generation
      apiMessages.push({
        role: "user",
        content: `Here are the facts of the case:\n\n${facts.trim()}\n\nPlease provide your analysis based on Indian law.`,
      });
    }

    const createStream = () =>
      client.chat.completions.create({
        model,
        messages: apiMessages,
        max_tokens: 4096,
        temperature: 0.4,
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
          console.error("[Arguments API] Stream error:", err);
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
    console.error("[Arguments API] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate arguments." }),
      {
        status: error.status || 500,
        headers: {
          "Content-Type": "application/json",
          "X-Request-Id": requestId,
        },
      }
    );
  }
}
