import type { TocEntryVerificationResult } from "../types";

const MAX_ACCURACY = 1.0;

interface TocVerificationReportArgs {
  accuracy: number;
  results: TocEntryVerificationResult[];
  correctIndices: Set<number>;
  incorrectIndices: Set<number>;
}

/** Aggregate verification report for an entire TOC list */
export class TocVerificationReport {
  public readonly accuracy: number;
  public readonly results: TocEntryVerificationResult[];
  public readonly correctIndices: Set<number>;
  public readonly incorrectIndices: Set<number>;

  constructor(args: TocVerificationReportArgs) {
    this.accuracy = args.accuracy;
    this.results = args.results;
    this.correctIndices = args.correctIndices;
    this.incorrectIndices = args.incorrectIndices;
  }

  get accuracyPercentage(): string {
    return (this.accuracy * 100).toFixed(1);
  }

  static empty(): TocVerificationReport {
    return new TocVerificationReport({
      accuracy: MAX_ACCURACY,
      results: [],
      correctIndices: new Set(),
      incorrectIndices: new Set(),
    });
  }
}
