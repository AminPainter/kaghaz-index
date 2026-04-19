import type { Tree } from "../tree";
import type { TreeNodeData } from "../types";
import type { ContextAssembler, ResolvedNode } from "./context-assembler";
import type { NodeMapBuilder } from "./node-map-builder";
import type { RelevantNodesFinder } from "./relevant-nodes-finder";
import type { TreeTextStripper } from "./tree-text-stripper";

/** Final output of a retrieval pass. */
export interface RetrievalResult {
  thinking: string;
  selectedNodeIds: string[];
  resolvedNodes: ResolvedNode[];
  context: string;
}

/**
 * Orchestrates LLM-driven tree search retrieval: strip text from
 * the tree, ask the LLM which nodes are relevant, then resolve
 * those ids back to document text. Collaborators are injected so
 * each step can be swapped or tested independently.
 */
export class TreeSearchRetriever {
  constructor(
    private readonly treeTextStripper: TreeTextStripper,
    private readonly relevantNodesFinder: RelevantNodesFinder,
    private readonly nodeMapBuilder: NodeMapBuilder,
    private readonly contextAssembler: ContextAssembler,
  ) {}

  async retrieve(
    tree: Tree<TreeNodeData>,
    query: string,
  ): Promise<RetrievalResult> {
    const stripped = this.treeTextStripper.strip(tree);
    const relevant = await this.relevantNodesFinder.find(query, stripped);

    const nodeMap = this.nodeMapBuilder.build(tree);
    const { resolvedNodes, context } = this.contextAssembler.assemble(
      relevant.nodeList,
      nodeMap,
    );

    return {
      thinking: relevant.thinking,
      selectedNodeIds: relevant.nodeList,
      resolvedNodes,
      context,
    };
  }
}
