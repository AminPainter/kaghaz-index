import type { ITreeNode, PageList, TreeNodeData } from "../types";
import type { Tree } from "../tree";

/**
 * Attaches raw PDF text to leaf nodes by concatenating pages
 * from startIndex (inclusive) to endIndex (exclusive).
 */
export class NodeTextAttacher {
  attach(tree: Tree<TreeNodeData>, pages: PageList): void {
    tree.forEach((node) => {
      if (!tree.isLeaf(node)) return;

      node.data.text = this.concatenatePageText(node, pages);
    });
  }

  private concatenatePageText(
    node: ITreeNode<TreeNodeData>,
    pages: PageList,
  ): string {
    return pages
      .slice(node.data.startIndex, node.data.endIndex)
      .map((page) => page.text)
      .join("\n");
  }
}
