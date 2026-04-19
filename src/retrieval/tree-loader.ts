import { readFile } from "fs/promises";
import { Tree } from "../tree";
import type { TreeNode, TreeNodeData } from "../types";

/**
 * Loads a persisted document tree JSON file from disk and wraps
 * its root in a Tree so callers get the traversal helpers for free.
 */
export class TreeLoader {
  async load(filePath: string): Promise<Tree<TreeNodeData>> {
    const raw = await readFile(filePath, "utf-8");
    const root = JSON.parse(raw) as TreeNode;
    return new Tree<TreeNodeData>(root);
  }
}
