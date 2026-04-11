import type { PageList, ResolvedTocEntry } from "../types";
import type { TocVerifier } from "./toc-verifier";
import type { IncorrectTocEntriesFixer } from "./incorrect-toc-entries-fixer";

const MAX_TOC_FIX_ATTEMPTS = 3;

/**
 * Stage 4 orchestrator. Verifies the TOC produced by Stage 3, then
 * either accepts it (accuracy 1.0) or repairs incorrect entries via
 * a retry loop. Treats LLM outputs as hypotheses and fact-checks
 * every mapping before passing results downstream.
 */
export class TocVerificationOrchestrator {
  constructor(
    private readonly tocVerifier: TocVerifier,
    private readonly incorrectTocEntriesFixer: IncorrectTocEntriesFixer,
  ) {}

  async process(
    tocEntries: ResolvedTocEntry[],
    pages: PageList,
  ): Promise<ResolvedTocEntry[]> {
    let currentList = tocEntries;
    let attempts = 0;

    do {
      const report = await this.tocVerifier.verify(currentList, pages);
      console.log(`Verification accuracy: ${report.accuracyPercentage}%`);

      if (report.accuracy === 1.0) return currentList;

      currentList = await this.incorrectTocEntriesFixer.fix({ tocEntries: currentList, report, pages });
      attempts++;
    } while (attempts < MAX_TOC_FIX_ATTEMPTS);

    // TODO: cascade to the next TocMode when accuracy remains low after all fix retries
    return currentList;
  }
}
