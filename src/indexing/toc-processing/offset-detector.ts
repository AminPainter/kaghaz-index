import type { PageList, PrintedTocEntry } from "../types";
import type { EntryLocator } from "./entry-locator";

const DEFAULT_SAMPLE_SIZE = 8;

/**
 * Determines the offset between printed page numbers and physical PDF
 * page indices by sampling a spread of TOC entries, locating each via
 * the EntryLocator, and taking a majority vote on the computed offsets.
 */
export class OffsetDetector {
  constructor(
    private readonly locator: EntryLocator,
    private readonly sampleSize: number = DEFAULT_SAMPLE_SIZE,
  ) {}

  async detect(entries: PrintedTocEntry[], pages: PageList): Promise<number> {
    const sampled = this.sampleEntries(entries);
    const offsets = await this.computeOffsets(sampled, pages);
    return this.majorityVote(offsets);
  }

  private sampleEntries(entries: PrintedTocEntry[]): PrintedTocEntry[] {
    if (entries.length <= this.sampleSize) return entries;

    const step = entries.length / this.sampleSize;
    const sampled: PrintedTocEntry[] = [];
    for (let i = 0; i < this.sampleSize; i++) {
      sampled.push(entries[Math.floor(i * step)]);
    }
    return sampled;
  }

  private async computeOffsets(
    entries: PrintedTocEntry[],
    pages: PageList,
  ): Promise<number[]> {
    const results = await Promise.all(
      entries.map((entry) => this.locator.locate(entry, pages)),
    );

    return results.map(
      (physicalIndex, i) => physicalIndex - entries[i].page,
    );
  }

  private majorityVote(offsets: number[]): number {
    const counts = new Map<number, number>();
    for (const offset of offsets) {
      counts.set(offset, (counts.get(offset) ?? 0) + 1);
    }

    let bestOffset = offsets[0];
    let bestCount = 0;
    for (const [offset, count] of counts) {
      if (count > bestCount) {
        bestOffset = offset;
        bestCount = count;
      }
    }

    return bestOffset;
  }
}
