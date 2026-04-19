import type { ResolvedTocEntry } from "../types";
import type { TreeNode } from "../../shared/data-structures/types";
import { PageRangeCalculator } from "./page-range-calculator";
import { TreeBuilder } from "./tree-builder";

/**
 * Orchestrates Stage 5 — Tree Assembly.
 * Takes verified flat TOC entries and produces a nested hierarchical tree.
 * Sub-steps: (A) calculate page ranges, (B) build nested tree,
 * (C) recursively split oversized leaf nodes.
 */
export class TreeAssembler {
  constructor(
    private readonly pageRangeCalculator: PageRangeCalculator,
    private readonly treeBuilder: TreeBuilder,
  ) {}

  async assemble(
    entries: ResolvedTocEntry[],
    totalPages: number,
  ): Promise<TreeNode> {
    const rangedEntries = this.pageRangeCalculator.calculate(
      entries,
      totalPages,
    );

    const tree = this.treeBuilder.build(rangedEntries);

    // TODO: Implement processLargeNodeRecursively() — walk every leaf node
    // and recursively run Stages 2–5 on leaves exceeding 10 pages or 20,000
    // tokens, replacing the oversized leaf's nodes array with the sub-tree.
    // Include a recursion depth limit (2–3 levels) to prevent infinite loops.

    return tree;
  }
}
