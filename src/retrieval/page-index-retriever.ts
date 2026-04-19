import { TreeSearchRetriever } from "./tree-search-retriever";
import { TreeTextStripper } from "./tree-text-stripper";
import { RelevantNodesFinder } from "./relevant-nodes-finder";
import { NodeMapBuilder } from "./node-map-builder";
import { ContextAssembler } from "./context-assembler";
import { TreeLoader } from "./tree-loader";

import type { ILlm } from "../shared/llm/llm.interface";
import type { TreeNode } from "../shared/data-structures/types";
import { Tree } from "../shared/data-structures/tree";
import type { RetrievalResult } from "./types";

export interface PageIndexRetrieverConfig {
  llm: ILlm;
}

export type RetrieveArgs =
  | { query: string; indexPath: string }
  | { query: string; tree: TreeNode };

/**
 * SDK façade for LLM-driven tree search retrieval. Consumers provide
 * an ILlm and call retrieve() with either a path to a saved index or
 * an in-memory tree. Wraps TreeSearchRetriever with all its
 * collaborators pre-wired.
 */
export class PageIndexRetriever {
  private readonly retriever: TreeSearchRetriever;
  private readonly treeLoader: TreeLoader;

  constructor(config: PageIndexRetrieverConfig) {
    this.retriever = new TreeSearchRetriever(
      new TreeTextStripper(),
      new RelevantNodesFinder(config.llm),
      new NodeMapBuilder(),
      new ContextAssembler(),
    );
    this.treeLoader = new TreeLoader();
  }

  async retrieve(args: RetrieveArgs): Promise<RetrievalResult> {
    const tree =
      "indexPath" in args
        ? await this.treeLoader.load(args.indexPath)
        : new Tree(args.tree);

    return this.retriever.retrieve(tree, args.query);
  }
}
