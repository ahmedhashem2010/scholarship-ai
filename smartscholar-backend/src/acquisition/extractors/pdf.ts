import { PDFParse } from 'pdf-parse';

export interface PdfResult {
  text: string;
  pageCount: number;
}

/**
 * Extract text from a PDF by URL. Returns empty text on any failure so the
 * pipeline can degrade gracefully.
 */
export async function extractPdfText(url: string): Promise<PdfResult> {
  try {
    const parser = new PDFParse({ url });
    const result = await parser.getText();
    return { text: result.text ?? '', pageCount: result.pages?.length ?? 0 };
  } catch {
    return { text: '', pageCount: 0 };
  }
}
