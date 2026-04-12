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

/** Enforces a uniform shape for all tree nodes: payload in data, subtree in children */
export interface ITreeNode<T> {
  data: T;
  children: ITreeNode<T>[];
}

/** The payload stored in each document tree node */
export interface TreeNodeData {
  title: string;
  headingLabel: string;
  startIndex: number;
  endIndex: number; // exclusive
  nodeId?: string;
  text?: string;
  summary?: string;
  docDescription?: string;
}

/** A document tree node (output of Stage 5, enriched in Stage 6) */
export type TreeNode = ITreeNode<TreeNodeData>;

/** A stack frame pairing a tree node with its nesting depth */
export type DepthNodePair = { depth: number; node: TreeNode };
