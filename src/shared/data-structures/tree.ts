import type { ITreeNode } from "./types";

/**
 * A lightweight generic wrapper around a root node that provides
 * common tree traversal and transformation primitives.
 * Operates on any ITreeNode<T> — the node must store its payload
 * in data and its subtree in children.
 */
export class Tree<T> {
  constructor(private readonly root: ITreeNode<T>) {}

  getRoot(): ITreeNode<T> {
    return this.root;
  }

  // TODO: See if this should be a method of the node instead of the tree, since it doesn't require any tree-level context
  isLeaf(node: ITreeNode<T>): boolean {
    return node.children.length === 0;
  }

  forEach(callback: (node: ITreeNode<T>) => void): void {
    this.preOrderDfs(this.root, callback);
  }

  groupByDepth(): Map<number, ITreeNode<T>[]> {
    const levels = new Map<number, ITreeNode<T>[]>();
    this.collectByDepth(this.root, 0, levels);
    return levels;
  }

  map<U>(transform: (node: ITreeNode<T>, mappedChildren: U[]) => U): U {
    return this.mapRecursive(this.root, transform);
  }

  private preOrderDfs(
    node: ITreeNode<T>,
    callback: (node: ITreeNode<T>) => void,
  ): void {
    callback(node);

    for (const child of node.children) {
      this.preOrderDfs(child, callback);
    }
  }

  private collectByDepth(
    node: ITreeNode<T>,
    depth: number,
    levels: Map<number, ITreeNode<T>[]>,
  ): void {
    const existing = levels.get(depth) ?? [];
    existing.push(node);
    levels.set(depth, existing);

    for (const child of node.children) {
      this.collectByDepth(child, depth + 1, levels);
    }
  }

  private mapRecursive<U>(
    node: ITreeNode<T>,
    transform: (node: ITreeNode<T>, mappedChildren: U[]) => U,
  ): U {
    const mappedChildren = node.children.map((child) =>
      this.mapRecursive(child, transform),
    );

    return transform(node, mappedChildren);
  }
}
