import OpenAI from "openai";
import { HfInference } from "@huggingface/inference";
import { checkAndDeductQuota } from "@/lib/quota-server";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const cloned = req.clone();
    const body = await cloned.json().catch(() => ({}));
    const { messages, model } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Auth + quota check
    const quotaResult = await checkAndDeductQuota(req);
    if (quotaResult.error) return quotaResult.error;

    const selectedModel = model || "meta/llama-3.3-70b-instruct";
    const isNvidia = selectedModel.startsWith("nvidia/") || selectedModel.startsWith("deepseek-ai/") || selectedModel.startsWith("meta/") || selectedModel.startsWith("mistralai/") || selectedModel.startsWith("google/") || selectedModel.startsWith("qwen/");

    if (isNvidia) {
      const apiKey = process.env.NVIDIA_API_KEY;
      if (!apiKey) {
        console.error("[Chat API] NVIDIA_API_KEY is missing");
        return new Response(
          JSON.stringify({
            error: "NVIDIA_API_KEY is not configured on the server.",
          }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }

      const client = new OpenAI({
        baseURL: "https://integrate.api.nvidia.com/v1",
        apiKey,
      });

      console.log(`[Chat API] Using NVIDIA model: ${selectedModel}`);

      const stream = await client.chat.completions.create({
        model: selectedModel,
        messages,
        max_tokens: 4096,
        temperature: 0.2,
        stream: true,
      });

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const choices = chunk.choices;
              if (!choices || choices.length === 0) continue;
              
              const content = choices[0].delta?.content;
              if (content) {
                controller.enqueue(encoder.encode(content));
              }
            }
          } catch (err) {
            console.error("[Chat API] NVIDIA stream error:", err);
            controller.enqueue(
              encoder.encode("\n\n[Error: The chat stream from NVIDIA was interrupted.]"),
            );
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } else {
      // Use Hugging Face for other models
      const hfToken = process.env.HUGGINGFACE_API_KEY;
      if (!hfToken) {
        return new Response(
          JSON.stringify({
            error: "HUGGINGFACE_API_KEY is not configured on the server.",
          }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }

      const hf = new HfInference(hfToken);
      console.log(`[Chat API] Using HF model: ${selectedModel}`);
      
      const stream = hf.chatCompletionStream({
        model: selectedModel,
        messages,
        max_tokens: 2048,
        temperature: 0.2,
      });

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              if (chunk.choices && chunk.choices.length > 0) {
                const content = chunk.choices[0].delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(content));
                }
              }
            }
          } catch (err) {
            console.error("[Chat API] HF stream error:", err);
            controller.enqueue(
              encoder.encode("\n\n[Error: The chat stream from Hugging Face was interrupted.]"),
            );
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }
  } catch (error) {
    console.error("[Chat API] Top-level error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to process chat query.",
        details: error.message 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
