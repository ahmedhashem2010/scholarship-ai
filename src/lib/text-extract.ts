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
  const pdfParse = await import("pdf-parse");
  const data = await pdfParse.default(buffer);
  const text = data.text?.trim() || "";
  if (!text) {
    throw new Error("No text could be extracted from the PDF. The file may be scanned/image-based.");
  }
  return text;
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
