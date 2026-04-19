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

/** The processing mode that Stage 3 will use */
export enum TocMode {
  PageNumberOffset = 1,
  FuzzyMatch = 2,
  SyntheticToc = 3,
}

/** Output of Stage 2 — TOC detection */
export class TocDetectionResult {
  constructor(
    public readonly tocPageIndices: number[],
    public readonly hasTocWithPageNumbers: boolean,
    public readonly mode: TocMode,
  ) {}

  static empty(): TocDetectionResult {
    return new TocDetectionResult([], false, TocMode.SyntheticToc);
  }
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

/** The result of verifying a single TOC entry against its page text */
export interface TocEntryVerificationResult {
  entryIndex: number;
  entry: ResolvedTocEntry;
  isCorrect: boolean;
  reasoning: string;
}

/** A resolved TOC entry augmented with start/end page range */
export interface RangedTocEntry extends ResolvedTocEntry {
  startIndex: number;
  endIndex: number;
}
