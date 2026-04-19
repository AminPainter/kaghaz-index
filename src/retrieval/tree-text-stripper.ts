import type { Tree } from "../tree";
import type { ITreeNode, TreeNodeData } from "../types";

/** A TreeNodeData without the heavyweight text field. */
export type StrippedNodeData = Omit<TreeNodeData, "text">;

/**
 * Produces a deep copy of a document tree with the full-text field
 * removed from every node. The stripped tree is what gets serialized
 * into the retrieval prompt so the LLM reasons over titles and
 * summaries only, keeping the prompt well within context limits.
 */
export class TreeTextStripper {
  strip(tree: Tree<TreeNodeData>): ITreeNode<StrippedNodeData> {
    return tree.map<ITreeNode<StrippedNodeData>>((node, mappedChildren) => {
      const { text: _text, ...rest } = node.data;
      return { data: rest, children: mappedChildren };
    });
  }
}
