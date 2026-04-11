import "dotenv/config";
import { PageIndexer } from "./page-indexing/page-indexer";
import { PdfPageExtractor } from "./page-indexing/pdf-page-extractor";
import { ApproximateTokenCounter } from "./page-indexing/approximate-token-counter";
import { AnthropicLlm } from "./llm/anthropic-llm";
import { TocPageClassifier } from "./toc-detection/toc-page-classifier";
import { TocBlockFinder } from "./toc-detection/toc-block-finder";
import { TocPageNumberDetector } from "./toc-detection/toc-page-number-detector";
import { TocDetector } from "./toc-detection/toc-detector";
import { TocEntryExtractor } from "./toc-processing/toc-entry-extractor";
import { EntryLocator } from "./toc-processing/entry-locator";
import { OffsetDetector } from "./toc-processing/offset-detector";
import { PageNumberOffsetProcessor } from "./toc-processing/page-number-offset-processor";
import { TocMode } from "./types";
import { TitleAppearanceChecker } from "./toc-verification/title-appearance-checker";
import { TocVerifier } from "./toc-verification/toc-verifier";
import { IncorrectTocEntriesFixer } from "./toc-verification/incorrect-toc-entries-fixer";
import { TocVerificationOrchestrator } from "./toc-verification/toc-verification-orchestrator";

async function main() {
  const pdfPath = process.argv[2];
  if (!pdfPath) {
    console.error("Usage: tsx src/index.ts <path-to-pdf>");
    process.exit(1);
  }

  // Stage 1 — Page extraction
  const indexer = new PageIndexer(
    new PdfPageExtractor(),
    new ApproximateTokenCounter(),
  );

  console.log(`Processing: ${pdfPath}`);
  const pageList = await indexer.index(pdfPath);

  console.log(`Total pages: ${pageList.length}`);
  console.log(`Total tokens: ${pageList.reduce((sum, p) => sum + p.tokenCount, 0)}`);
  console.log("\nPer-page token counts:");
  pageList.forEach((page, i) => {
    console.log(`  Page ${i + 1}: ${page.tokenCount} tokens`);
  });

  // Stage 2 — TOC detection
  const llm = new AnthropicLlm();
  const tocDetector = new TocDetector(
    new TocBlockFinder(new TocPageClassifier(llm)),
    new TocPageNumberDetector(llm),
  );

  console.log("\nDetecting table of contents...");
  const tocResult = await tocDetector.detect(pageList);

  console.log("\nTOC Detection Result:");
  console.log(`  TOC pages found: [${tocResult.tocPageIndices.join(", ")}]`);
  console.log(`  Has page numbers: ${tocResult.hasTocWithPageNumbers}`);
  console.log(`  Processing mode for Stage 3: Mode ${tocResult.mode}`);

  // Stage 3 — TOC processing
  // TODO: implement Mode 2 (FuzzyMatch) processor
  // TODO: implement Mode 3 (SyntheticToc) processor
  if (tocResult.mode === TocMode.PageNumberOffset) {
    const stage3Processor = new PageNumberOffsetProcessor(
      new TocEntryExtractor(llm),
      new OffsetDetector(new EntryLocator(llm)),
    );

    console.log("\nProcessing TOC (Mode 1 — Page Number Offset)...");
    const tocEntries = await stage3Processor.process(pageList, tocResult.tocPageIndices);

    console.log(`\nExtracted ${tocEntries.length} TOC entries:`);
    for (const entry of tocEntries) {
      const label = entry.headingLabel ? `${entry.headingLabel}. ` : "";
      console.log(`  ${label}${entry.title} → physical page ${entry.physicalIndex}`);
    }

    // Stage 4 — TOC verification & correction
    const verificationProcessor = new TocVerificationOrchestrator(
      new TocVerifier(new TitleAppearanceChecker(llm)),
      new IncorrectTocEntriesFixer(llm),
    );

    console.log("\nVerifying TOC (Stage 4)...");
    const verifiedEntries = await verificationProcessor.process(
      tocEntries,
      pageList,
    );

    console.log(`\nVerified ${verifiedEntries.length} TOC entries:`);
    for (const entry of verifiedEntries) {
      const label = entry.headingLabel ? `${entry.headingLabel}. ` : "";
      console.log(`  ${label}${entry.title} → physical page ${entry.physicalIndex}`);
    }
  }
}

main().catch(console.error);
