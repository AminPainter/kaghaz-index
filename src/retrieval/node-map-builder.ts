import type { Tree } from "../shared/data-structures/tree";
import type { TreeNode, TreeNodeData } from "../shared/data-structures/types";

/**
 * Flattens a document tree into a lookup from node id to node.
 * Retrieval returns ids chosen by the LLM, and this map is how we
 * resolve them back to the original nodes (and their full text).
 */
export class NodeMapBuilder {
  build(tree: Tree<TreeNodeData>): Map<string, TreeNode> {
    const map = new Map<string, TreeNode>();

    tree.forEach((node) => {
      if (node.data.nodeId) {
        map.set(node.data.nodeId, node);
      }
    });

    return map;
  }
}
