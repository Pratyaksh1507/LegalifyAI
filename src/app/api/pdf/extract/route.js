export const dynamic = "force-dynamic";

/**
 * Checks if extracted text looks like garbled binary / image-only content.
 * A real text-based PDF should have a high ratio of printable ASCII characters.
 */
function isLikelyGarbledOrEmpty(text) {
  if (!text || text.trim().length === 0) return true;
  // Count printable characters
  const printable = text.split("").filter((c) => {
    const code = c.charCodeAt(0);
    return (code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13;
  }).length;
  const ratio = printable / text.length;
  // If less than 60% printable chars, likely garbled binary
  return ratio < 0.6;
}

/**
 * Counts approximate page count from pdfjs-style extraction markers
 * or falls back to character-based estimate for other file types.
 */
function estimatePageCount(text, fileType) {
  if (fileType === "pdf") {
    // pdf-parse does not insert page markers, but we can estimate from common patterns
    // Each page typically has ~2000-3000 characters in a standard legal document
    return Math.max(1, Math.round(text.length / 2500));
  }
  return 1;
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const buffer = await file.arrayBuffer();
    const name = file.name.toLowerCase();
    const uint8 = new Uint8Array(buffer);

    let text = "";
    let pageCount = 1;
    let fileType = "unknown";

    const extractionPromise = async () => {
      if (name.endsWith(".pdf")) {
        fileType = "pdf";
        let pdfParse;
        try {
          const pdfParseModule = await import("pdf-parse");
          pdfParse = pdfParseModule.default || pdfParseModule;
        } catch {
          throw new Error("PDF parsing library failed to load. Please try again.");
        }

        let data;
        try {
          data = await pdfParse(Buffer.from(uint8));
        } catch (pdfErr) {
          // Common error: password-protected PDF
          if (pdfErr.message?.toLowerCase().includes("password")) {
            throw new Error("Password-protected PDF detected. Please remove the password and re-upload.");
          }
          throw new Error(`PDF parsing failed: ${pdfErr.message}`);
        }

        const rawText = data.text || "";
        pageCount = data.numpages || estimatePageCount(rawText, "pdf");

        // Check for scanned / image-only PDF
        if (isLikelyGarbledOrEmpty(rawText)) {
          throw new Error(
            "Scanned or Image-based PDF detected. Legalify cannot read image-only PDFs. Please upload a text-searchable PDF (created from a word processor or OCR-converted), or convert the file to DOC/DOCX format."
          );
        }

        return rawText;
      } else if (name.endsWith(".docx")) {
        fileType = "docx";
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer: Buffer.from(uint8) });
        pageCount = Math.max(1, Math.round((result.value || "").length / 2500));
        return result.value || "";
      } else if (name.endsWith(".doc")) {
        // Use mammoth for .doc files as well (it handles legacy .doc format)
        fileType = "doc";
        try {
          const mammoth = await import("mammoth");
          const result = await mammoth.extractRawText({ buffer: Buffer.from(uint8) });
          const extracted = result.value || "";

          // If mammoth returns empty or garbled for very old .doc format, throw a helpful error
          if (isLikelyGarbledOrEmpty(extracted)) {
            throw new Error(
              "Could not extract text from this .doc file. This may be an older binary format. Please save the file as .docx or .pdf and re-upload."
            );
          }

          pageCount = Math.max(1, Math.round(extracted.length / 2500));
          return extracted;
        } catch (docErr) {
          // If mammoth itself throws (e.g., truly corrupt file)
          if (docErr.message?.includes("Could not extract")) throw docErr;
          throw new Error(
            "Failed to parse .doc file. Please convert to .docx or .pdf format and re-upload."
          );
        }
      } else if (name.endsWith(".txt")) {
        fileType = "txt";
        const decoded = new TextDecoder().decode(uint8);
        pageCount = Math.max(1, Math.round(decoded.length / 2500));
        return decoded;
      } else {
        throw new Error(
          `Unsupported file type: "${name.split(".").pop().toUpperCase()}". Please upload PDF, DOCX, DOC, or TXT files.`
        );
      }
    };

    // 30-second timeout guard
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("File extraction timed out. The document may be too large or complex. Please try a smaller file.")),
        30000
      )
    );

    text = await Promise.race([extractionPromise(), timeoutPromise]);

    return new Response(
      JSON.stringify({
        text: text.trim(),
        pageCount,
        fileType,
        charCount: text.trim().length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Extract API] Error:", error.message);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to extract text from file.",
        // Include a user-friendly title for frontend display
        errorType: error.message?.includes("Scanned") ? "scanned_pdf"
          : error.message?.includes("Password") ? "password_protected"
          : error.message?.includes("Unsupported") ? "unsupported_format"
          : "extraction_failed",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
