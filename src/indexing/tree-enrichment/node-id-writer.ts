import type { TreeNodeData } from "../../shared/data-structures/types";
import type { Tree } from "../../shared/data-structures/tree";

/**
 * Assigns a sequential, zero-padded 4-digit string ID to every node
 * in the tree using a depth-first traversal.
 */
export class NodeIdWriter {
  private counter: number = 0;

  write(tree: Tree<TreeNodeData>): void {
    this.counter = 0;
    tree.forEach((node) => {
      this.counter++;
      node.data.nodeId = String(this.counter).padStart(4, "0");
    });
  }
}
