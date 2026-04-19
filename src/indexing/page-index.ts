import { basename, extname } from "path";

import { PageIndexer } from "./page-indexing/page-indexer";
import { PdfPageExtractor } from "./page-indexing/pdf-page-extractor";
import { ApproximateTokenCounter } from "./page-indexing/approximate-token-counter";
import { TocPageClassifier } from "./toc-detection/toc-page-classifier";
import { TocBlockFinder } from "./toc-detection/toc-block-finder";
import { TocPageNumberDetector } from "./toc-detection/toc-page-number-detector";
import { TocDetector } from "./toc-detection/toc-detector";
import { TocEntryExtractor } from "./toc-processing/toc-entry-extractor";
import { EntryLocator } from "./toc-processing/entry-locator";
import { OffsetDetector } from "./toc-processing/offset-detector";
import { PageNumberOffsetProcessor } from "./toc-processing/page-number-offset-processor";
import { TitleAppearanceChecker } from "./toc-verification/title-appearance-checker";
import { TocVerifier } from "./toc-verification/toc-verifier";
import { IncorrectTocEntriesFixer } from "./toc-verification/incorrect-toc-entries-fixer";
import { TocVerificationOrchestrator } from "./toc-verification/toc-verification-orchestrator";
import { PageRangeCalculator } from "./tree-assembly/page-range-calculator";
import { TreeBuilder } from "./tree-assembly/tree-builder";
import { TreeAssembler } from "./tree-assembly/tree-assembler";
import { NodeIdWriter } from "./tree-enrichment/node-id-writer";
import { NodeTextAttacher } from "./tree-enrichment/node-text-attacher";
import { SummaryGenerator } from "./tree-enrichment/summary-generator";
import { DocDescriptionGenerator } from "./tree-enrichment/doc-description-generator";
import { TreeEnricher } from "./tree-enrichment/tree-enricher";
import { IndexSaver } from "./index-saving/index-saver";

import type { ILlm } from "../shared/llm/llm.interface";
import type { TreeNode } from "../shared/data-structures/types";
import { TocMode } from "./types";
import type { IPageExtractor, ITokenCounter } from "./types";

export interface PageIndexConfig {
  llm: ILlm;
  pageExtractor?: IPageExtractor;
  tokenCounter?: ITokenCounter;
}

export interface BuildOptions {
  outputDir?: string;
}

/**
 * SDK façade for the seven-stage indexing pipeline. Consumers provide an
 * ILlm (and optionally override the page extractor or token counter),
 * then call build() to turn a PDF into a hierarchical document tree.
 * When outputDir is supplied, the tree is also persisted to disk.
 */
export class PageIndex {
  private readonly pageIndexer: PageIndexer;
  private readonly tocDetector: TocDetector;
  private readonly pageNumberOffsetProcessor: PageNumberOffsetProcessor;
  private readonly tocVerificationOrchestrator: TocVerificationOrchestrator;
  private readonly treeAssembler: TreeAssembler;
  private readonly treeEnricher: TreeEnricher;

  constructor(config: PageIndexConfig) {
    const { llm } = config;

    this.pageIndexer = new PageIndexer(
      config.pageExtractor ?? new PdfPageExtractor(),
      config.tokenCounter ?? new ApproximateTokenCounter(),
    );
    this.tocDetector = new TocDetector(
      new TocBlockFinder(new TocPageClassifier(llm)),
      new TocPageNumberDetector(llm),
    );
    this.pageNumberOffsetProcessor = new PageNumberOffsetProcessor(
      new TocEntryExtractor(llm),
      new OffsetDetector(new EntryLocator(llm)),
    );
    this.tocVerificationOrchestrator = new TocVerificationOrchestrator(
      new TocVerifier(new TitleAppearanceChecker(llm)),
      new IncorrectTocEntriesFixer(llm),
    );
    this.treeAssembler = new TreeAssembler(
      new PageRangeCalculator(),
      new TreeBuilder(),
    );
    this.treeEnricher = new TreeEnricher(
      new NodeIdWriter(),
      new NodeTextAttacher(),
      new SummaryGenerator(llm),
      new DocDescriptionGenerator(llm),
    );
  }

  async build(pdfPath: string, options?: BuildOptions): Promise<TreeNode> {
    const pageList = await this.pageIndexer.index(pdfPath);
    const tocResult = await this.tocDetector.detect(pageList);

    if (tocResult.mode !== TocMode.PageNumberOffset) {
      // TODO: implement Mode 2 (FuzzyMatch) and Mode 3 (SyntheticToc)
      throw new Error(
        `TOC mode ${tocResult.mode} is not yet supported. Only PageNumberOffset (Mode 1) is implemented.`,
      );
    }

    const tocEntries = await this.pageNumberOffsetProcessor.process(
      pageList,
      tocResult.tocPageIndices,
    );
    const verifiedEntries = await this.tocVerificationOrchestrator.process(
      tocEntries,
      pageList,
    );
    const tree = await this.treeAssembler.assemble(
      verifiedEntries,
      pageList.length,
    );
    await this.treeEnricher.enrich(tree, pageList);

    if (options?.outputDir) {
      const indexSaver = new IndexSaver(options.outputDir);
      const pdfFilename = basename(pdfPath, extname(pdfPath));
      await indexSaver.save(tree, pdfFilename);
    }

    return tree;
  }
}
