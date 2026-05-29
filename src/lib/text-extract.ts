import { downloadFileAsBuffer } from "@/lib/supabase/storage";

export async function extractTextFromFile(
  fileUrl: string,
  fileType: string
): Promise<string> {
  const buffer = await downloadFileAsBuffer(fileUrl);

  if (fileType === "application/pdf") {
    return extractFromPDF(buffer);
  }

  if (
    fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileType === "application/msword"
  ) {
    return extractFromDOCX(buffer);
  }

  throw new Error(`Unsupported file type: ${fileType}. Only PDF and DOCX are supported.`);
}

async function extractFromPDF(buffer: Buffer): Promise<string> {
  const { createRequire } = await import("node:module");
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.js");
  const runtimeRequire = createRequire(process.cwd() + "/.next/noop.js");
  const workerPath = runtimeRequire.resolve(
    "pdfjs-dist/legacy/build/pdf.worker.js"
  );
  pdfjs.GlobalWorkerOptions.workerSrc = workerPath;
  const data = new Uint8Array(buffer);
  const loadingTask = pdfjs.getDocument({ data });
  const doc = await loadingTask.promise;
  try {
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .filter((item) => "str" in item)
        .map((item) => (item as { str: string }).str)
        .join(" ");
      pages.push(pageText);
    }
    const text = pages.join("\n").trim();
    if (!text) {
      throw new Error("No text could be extracted from the PDF. The file may be scanned/image-based.");
    }
    return text;
  } finally {
    doc.destroy();
  }
}

async function extractFromDOCX(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value?.trim() || "";
  if (!text) {
    throw new Error("No text could be extracted from the DOCX file.");
  }
  return text;
}
