/**
 * Document download + text extraction for deep extraction.
 *
 * PDFs are downloaded to a bounded buffer and parsed with pdf-parse (v2).
 * DOCX files are ZIP archives: a minimal central-directory reader extracts
 * `word/document.xml` and strips markup. Legacy binary `.doc` files are
 * reported as unsupported rather than guessed at.
 */

import { PDFParse } from 'pdf-parse';
import { inflateRawSync } from 'node:zlib';
import { DetectedDoc } from './types';

const MAX_DOWNLOAD_BYTES = 20 * 1024 * 1024;
const DOC_TEXT_MAX = 20_000;

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

export async function downloadBuffer(url: string, maxBytes = MAX_DOWNLOAD_BYTES): Promise<Buffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': UA },
      redirect: 'follow',
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (!response.body) throw new Error('empty body');
    const length = Number(response.headers.get('content-length') ?? '0');
    if (length > maxBytes) throw new Error(`too large (${Math.round(length / 1024 / 1024)}MB)`);
    const chunks: Uint8Array[] = [];
    let total = 0;
    const reader = response.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.byteLength;
      if (total > maxBytes) throw new Error(`too large (>${Math.round(maxBytes / 1024 / 1024)}MB)`);
    }
    return Buffer.concat(chunks);
  } finally {
    clearTimeout(timer);
  }
}

async function extractPdf(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return { text: result.text ?? '', pageCount: result.pages?.length ?? 0 };
}

function decodeXmlEntities(xml: string): string {
  return xml
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_m, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

/** Minimal ZIP central-directory reader. Returns raw entry bytes or null. */
function zipEntry(buf: Buffer, entryName: string): Buffer | null {
  const EOCD_SIG = 0x06054b50;
  const CD_SIG = 0x02014b50;
  const LFH_SIG = 0x04034b50;

  // Locate EOCD within the final 64KB.
  const tailStart = Math.max(0, buf.length - (22 + 65535));
  const tail = buf.subarray(tailStart);
  let eocdIdx = -1;
  for (let i = tail.length - 22; i >= 0; i--) {
    if (tail.readUInt32LE(i) === EOCD_SIG) {
      eocdIdx = tailStart + i;
      break;
    }
  }
  if (eocdIdx < 0) return null;
  const eocd = buf.subarray(eocdIdx);
  const cdSize = eocd.readUInt32LE(12);
  const cdOffset = eocd.readUInt32LE(16);
  if (cdOffset === 0xffffffff || cdSize === 0xffffffff) return null; // ZIP64 unsupported
  const cdEnd = cdOffset + cdSize;
  if (cdEnd > buf.length) return null;

  let pos = cdOffset;
  while (pos + 46 <= cdEnd) {
    if (buf.readUInt32LE(pos) !== CD_SIG) break;
    const method = buf.readUInt16LE(pos + 10);
    const compSize = buf.readUInt32LE(pos + 20);
    const uncompSize = buf.readUInt32LE(pos + 24);
    const nameLen = buf.readUInt16LE(pos + 28);
    const extraLen = buf.readUInt16LE(pos + 30);
    const commentLen = buf.readUInt16LE(pos + 32);
    const localOffset = buf.readUInt32LE(pos + 42);
    const name = buf.subarray(pos + 46, pos + 46 + nameLen).toString('utf8');
    if (name === entryName) {
      // Local file header for the data offset.
      if (localOffset + 30 > buf.length) return null;
      if (buf.readUInt32LE(localOffset) !== LFH_SIG) return null;
      const lNameLen = buf.readUInt16LE(localOffset + 26);
      const lExtraLen = buf.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + lNameLen + lExtraLen;
      const data = buf.subarray(dataStart, dataStart + compSize);
      if (compSize === 0 && uncompSize === 0) return Buffer.alloc(0);
      try {
        if (method === 0) return Buffer.from(data);
        if (method === 8) return inflateRawSync(data);
      } catch {
        return null;
      }
      return null;
    }
    pos += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}

function docxText(buf: Buffer): string {
  const xml = zipEntry(buf, 'word/document.xml');
  if (!xml) return '';
  let text = xml.toString('utf8');
  text = text.replace(/<w:tab[^>]*\/>/g, '\t');
  text = text.replace(/<w:br[^>]*\/>/g, '\n');
  text = text.replace(/<\/w:p>/g, '\n');
  text = text.replace(/<[^>]+>/g, '');
  text = decodeXmlEntities(text);
  return text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

export interface ExtractResult {
  text: string;
  pageCount: number;
}

/** Extract text from a downloaded buffer by declared kind. */
export async function extractDocText(kind: 'pdf' | 'docx' | 'doc', buffer: Buffer): Promise<ExtractResult> {
  if (kind === 'pdf') return extractPdf(buffer);
  if (kind === 'docx') {
    const text = docxText(buffer);
    return { text, pageCount: 0 };
  }
  return { text: '', pageCount: 0 };
}

/**
 * Download and analyze a detected document, populating text/pageCount/error.
 * Returns a fresh DetectedDoc (the input is treated as immutable).
 */
export async function analyzeDoc(doc: DetectedDoc): Promise<DetectedDoc> {
  try {
    const buffer = await downloadBuffer(doc.url);
    const { text, pageCount } = await extractDocText(doc.kind, buffer);
    const clean = text.replace(/\s+/g, ' ').trim().slice(0, DOC_TEXT_MAX);
    if (clean.length < 80) {
      return { ...doc, text: '', pageCount, error: 'no usable text extracted' };
    }
    return { ...doc, text: clean, pageCount, error: null };
  } catch (err) {
    return { ...doc, text: '', pageCount: 0, error: err instanceof Error ? err.message : 'download failed' };
  }
}

/** Analyze a batch of docs concurrently, returning those with usable text. */
export async function analyzeDocs(docs: DetectedDoc[], concurrency = 3): Promise<DetectedDoc[]> {
  const results: DetectedDoc[] = [];
  const queue = [...docs];
  const workers = Array.from({ length: Math.min(concurrency, Math.max(1, queue.length)) }, async () => {
    for (;;) {
      const next = queue.shift();
      if (!next) return;
      results.push(await analyzeDoc(next));
    }
  });
  await Promise.all(workers);
  return results.filter((d) => d.text.length > 0);
}
