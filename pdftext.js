// PDF text extraction, browser-only, split from scoring.js so serverless functions
// can import the pure scoring module without dragging the ~3MB pdfjs bundle into
// every function build. Lazy-loads pdfjs-dist only when a PDF is actually uploaded.
// data: ArrayBuffer or Uint8Array. Returns "" on any failure - callers treat that
// as "no measurement", never as a user-facing error.
export async function extractPdfText(data) {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    if (typeof window !== "undefined") {
      const worker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs?url");
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    }
    const doc = await pdfjs.getDocument({ data, isEvalSupported: false, useSystemFonts: true }).promise;
    let out = "";
    const pages = Math.min(doc.numPages, 12);
    for (let p = 1; p <= pages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      let last = null;
      for (const item of content.items) {
        if (!("str" in item)) continue;
        if (last && Math.abs((item.transform?.[5] ?? 0) - last) > 2) out += "\n";
        else if (out && !out.endsWith("\n") && item.str && !out.endsWith(" ")) out += " ";
        out += item.str;
        last = item.transform?.[5] ?? last;
      }
      out += "\n\n";
    }
    try { doc.destroy(); } catch (e) { /* best-effort cleanup */ }
    return out;
  } catch (e) {
    return "";
  }
}
