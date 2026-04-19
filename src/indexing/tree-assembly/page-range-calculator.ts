import type { ResolvedTocEntry, RangedTocEntry } from "../types";

/**
 * Calculates the page range (start/end) for each TOC entry.
 * A section starts at its own physicalIndex and ends where the next section begins.
 * The last section ends at totalPages.
 */
export class PageRangeCalculator {
  calculate(entries: ResolvedTocEntry[], totalPages: number): RangedTocEntry[] {
    return entries.map((entry, i) => {
      const isLastEntry = i === entries.length - 1;
      const nextEntry = entries[i + 1];

      return {
        ...entry,
        startIndex: entry.physicalIndex,
        endIndex: isLastEntry ? totalPages : nextEntry.physicalIndex,
      };
    });
  }
}
