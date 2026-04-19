/** Enforces a uniform shape for all tree nodes: payload in data, subtree in children */
export interface ITreeNode<T> {
  data: T;
  children: ITreeNode<T>[];
}

/** The payload stored in each document tree node */
export interface TreeNodeData {
  title: string;
  headingLabel: string;
  startIndex: number;
  endIndex: number; // exclusive
  nodeId?: string;
  text?: string;
  summary?: string;
  docDescription?: string;
}

/** A document tree node (output of Stage 5, enriched in Stage 6) */
export type TreeNode = ITreeNode<TreeNodeData>;

/** A stack frame pairing a tree node with its nesting depth */
export type DepthNodePair = { depth: number; node: TreeNode };
