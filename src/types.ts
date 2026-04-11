import type { ZodType } from "zod";

/** A single page's extracted data */
export interface PageEntry {
  text: string;
  tokenCount: number;
}

/** An ordered array of page entries, index = physical page (0-based) */
export type PageList = PageEntry[];

/** Counts tokens for a given text string */
export interface ITokenCounter {
  count(text: string): number;
}

/** Extracts per-page text from a document */
export interface IPageExtractor {
  extract(input: string | Buffer): Promise<string[]>;
}

/** Sends a prompt to an LLM and returns a structured response matching the given Zod schema */
export interface ILlm {
  callWithStructuredOutput<T extends Record<string, any>>(
    prompt: string,
    schema: ZodType<T>,
  ): Promise<T>;
}

/** The processing mode that Stage 3 will use */
export enum TocMode {
  PageNumberOffset = 1,
  FuzzyMatch = 2,
  SyntheticToc = 3,
}

/** Output of Stage 2 — TOC detection */
export interface TocDetectionResult {
  tocPageIndices: number[];
  hasTocWithPageNumbers: boolean;
  mode: TocMode;
}

/** A TOC entry with the printed page number (before offset correction) */
export interface PrintedTocEntry {
  headingLabel: string;
  title: string;
  page: number;
}

/** A TOC entry with the resolved physical PDF page index (0-based) */
export interface ResolvedTocEntry {
  headingLabel: string;
  title: string;
  physicalIndex: number;
}
