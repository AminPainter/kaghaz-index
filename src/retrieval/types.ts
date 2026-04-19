import type { TreeNodeData } from "../shared/data-structures/types";

/** A TreeNodeData without the heavyweight text field. */
export type StrippedNodeData = Omit<TreeNodeData, "text">;

/** A single selected node resolved back to its text. */
export interface ResolvedNode {
  nodeId: string;
  title: string;
  text: string;
}

/** Final output of a retrieval pass. */
export interface RetrievalResult {
  thinking: string;
  selectedNodeIds: string[];
  resolvedNodes: ResolvedNode[];
  context: string;
}
