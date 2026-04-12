import { Stack } from "../stack";
import type { DepthNodePair, RangedTocEntry, TreeNode } from "../types";

/**
 * Converts a flat list of ranged TOC entries into a nested tree
 * using a stack-based parent tracking algorithm.
 * Nesting is determined by the depth of each entry's headingLabel
 * (number of dot-separated segments).
 */
export class TreeBuilder {
  build(tocEntries: RangedTocEntry[]): TreeNode {
    const root = this.createRootNode(tocEntries);
    const stack = new Stack<DepthNodePair>();
    stack.push({ depth: 0, node: root });

    for (const entry of tocEntries) {
      const node = this.toTreeNode(entry);
      this.popTillTopOfStackBecomesParentOfCurrentEntry(stack, entry);

      const parent = stack.peek().node;
      parent.children.push(node);

      stack.push({
        depth: this.calculateDepthOfNode(entry.headingLabel),
        node,
      });
    }

    return root;
  }

  private createRootNode(entries: RangedTocEntry[]): TreeNode {
    return {
      data: {
        title: "Document Root",
        headingLabel: "0",
        startIndex: 0,
        endIndex: entries.length > 0 ? entries[entries.length - 1].endIndex : 0,
      },
      children: [],
    };
  }

  private toTreeNode(entry: RangedTocEntry): TreeNode {
    return {
      data: {
        title: entry.title,
        headingLabel: entry.headingLabel,
        startIndex: entry.startIndex,
        endIndex: entry.endIndex,
      },
      children: [],
    };
  }

  private calculateDepthOfNode(headingLabel: string): number {
    return headingLabel.split(".").length; // 2.3.7 => depth 3
  }

  private popTillTopOfStackBecomesParentOfCurrentEntry(
    stack: Stack<DepthNodePair>,
    currentEntry: RangedTocEntry,
  ): void {
    const currentEntryDepth = this.calculateDepthOfNode(
      currentEntry.headingLabel,
    );

    const entryCurrentlyOnTopOfStack = stack.peek();

    while (
      stack.size() > 1 && // Keep at least one element so the root node is never popped
      entryCurrentlyOnTopOfStack.depth >= currentEntryDepth
    ) {
      stack.pop();
    }
  }
}
