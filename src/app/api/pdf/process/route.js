import { HfInference } from "@huggingface/inference";
import { createAdminClient } from "@/lib/supabase-server";

function chunkText(text, size = 800) {
  const chunks = [];
  const words = text.split(/\s+/);
  let currentChunk = "";

  for (const word of words) {
    if ((currentChunk + word).length > size) {
      chunks.push(currentChunk.trim());
      currentChunk = "";
    }
    currentChunk += word + " ";
  }
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}

export async function POST(req) {
  try {
    const { text, filename, storage_path } = await req.json();

    if (!text || !filename) {
      return new Response(JSON.stringify({ error: "Text and filename are required" }), { status: 400 });
    }

    if (!process.env.HUGGINGFACE_API_KEY) {
      throw new Error("HUGGINGFACE_API_KEY is not set in .env.local");
    }

    // Initialize Supabase admin client
    let supabase;
    try {
      supabase = createAdminClient();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Server configuration error: Supabase key is required." }), { status: 500 });
    }

    const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

    // 1. Create document record
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({ 
        filename, 
        storage_path: storage_path || "client-side-upload" 
      })
      .select()
      .single();

    if (docError) throw new Error(`Database Error (Documents): ${docError.message}`);

    // 2. Chunk and Embed (Fast Batch)
    const chunks = chunkText(text, 800);
    console.log(`[Process] Found ${chunks.length} chunks for ${filename}`);

    const embeddings = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: chunks,
    });

    if (!embeddings || embeddings.length === 0) {
      throw new Error("Failed to generate embeddings from Hugging Face.");
    }

    const chunkRecords = chunks.map((content, i) => {
      const embedding = Array.isArray(embeddings[i][0]) ? embeddings[i][0] : embeddings[i];
      return {
        document_id: doc.id,
        content,
        embedding: Array.from(embedding),
        chunk_index: i,
      };
    });

    // 3. Insert chunks
    const { error: chunksError } = await supabase.from("chunks").insert(chunkRecords);
    if (chunksError) throw new Error(`Database Error (Chunks): ${chunksError.message}`);

    return new Response(JSON.stringify({ success: true, document_id: doc.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("PDF Process Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
