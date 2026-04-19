import { extractText, getDocumentProxy } from "unpdf";
import { readFile } from "node:fs/promises";
import type { IPageExtractor } from "../types";

/**
 * Extracts the text content of each page from a PDF file
 * using the unpdf library.
 */
export class PdfPageExtractor implements IPageExtractor {
  async extract(fileInput: string | Buffer): Promise<string[]> {
    const buffer = await this.toUint8Array(fileInput);
    const pdf = await getDocumentProxy(buffer);
    const { text: pagesContent } = await extractText(pdf, {
      mergePages: false,
    });

    return pagesContent;
  }

  private async toUint8Array(fileInput: string | Buffer): Promise<Uint8Array> {
    if (typeof fileInput === "string") {
      const fileBuffer = await readFile(fileInput);
      return new Uint8Array(fileBuffer);
    }

    return new Uint8Array(fileInput);
  }
}
