import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { TreeNode } from "../types";

/**
 * Persists a document tree to disk as a pretty-printed JSON file.
 * Creates the output directory if it does not already exist.
 */
export class IndexSaver {
  constructor(private readonly outputDir: string = "./results") {}

  async save(tree: TreeNode, filename: string): Promise<string> {
    await mkdir(this.outputDir, { recursive: true });

    const outputPath = path.join(
      this.outputDir,
      `${filename}.kaghaz-index.json`,
    );
    await writeFile(outputPath, JSON.stringify(tree, null, 2));

    return outputPath;
  }
}
