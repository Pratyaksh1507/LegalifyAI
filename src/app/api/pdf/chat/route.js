import { HfInference } from "@huggingface/inference";
import OpenAI from "openai";
import { checkAndDeductQuota } from "@/lib/quota-server";
import { createAdminClient } from "@/lib/supabase-server";

export async function POST(req) {
  try {
    const cloned = req.clone();
    const { question, document_id, top_k = 5 } = await cloned.json();

    if (!question) {
      return new Response(JSON.stringify({ error: "Question is required" }), { status: 400 });
    }

    // Auth + quota check
    const quotaResult = await checkAndDeductQuota(req);
    if (quotaResult.error) return quotaResult.error;

    // Initialize Supabase admin client
    let supabase;
    try {
      supabase = createAdminClient();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Server configuration error: Supabase key is required." }), { status: 500 });
    }

    const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

    // 1. Generate embedding for the question
    const embedding = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: question,
    });
    const flatEmbedding = Array.isArray(embedding[0]) ? embedding[0] : embedding;

    // 2. Vector similarity search via Supabase RPC
    let query = supabase.rpc("match_chunks", {
      query_embedding: Array.from(flatEmbedding),
      match_threshold: 0.1,
      match_count: top_k,
    });

    if (document_id) {
      query = query.eq("document_id", document_id);
    }

    const { data: matches, error: matchError } = await query;
    if (matchError) throw matchError;

    // 3. Build context from matches
    const context = matches && matches.length > 0 
      ? matches.map((m) => m.content).join("\n\n")
      : "No specific context found in the document.";

    // 4. Initialize NVIDIA OpenAI Client for Streaming
    const nvidiaClient = new OpenAI({
      baseURL: "https://integrate.api.nvidia.com/v1",
      apiKey: process.env.NVIDIA_API_KEY,
    });

    const stream = await nvidiaClient.chat.completions.create({
      model: "deepseek-ai/deepseek-v3", // High performance reasoning model
      messages: [
        {
          role: "system",
          content: "You are Legalify AI. Answer based ONLY on the provided context. If the context doesn't have the info, be honest. Use clear, plain text. Include your chain of thought inside <think> tags.",
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion: ${question}`,
        },
      ],
      stream: true,
      max_tokens: 4096,
      temperature: 0.1,
    });

    // 5. Return ReadableStream to the frontend
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            controller.enqueue(new TextEncoder().encode(content));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Sources-Count": matches?.length.toString() || "0",
      },
    });

  } catch (error) {
    console.error("PDF Chat Streaming Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
