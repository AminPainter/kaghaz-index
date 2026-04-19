import { z } from "zod";
import type { ILlm } from "../../shared/llm/llm.interface";
import type {
  ITreeNode,
  TreeNodeData,
} from "../../shared/data-structures/types";
import type { Tree } from "../../shared/data-structures/tree";

const summarySchema = z.object({
  summary: z.string().describe("A concise 2-3 sentence summary of the section"),
});

/**
 * Generates LLM summaries for every node in the tree using a bottom-up,
 * level-by-level approach. Leaf nodes are summarized from their raw text,
 * parent nodes from their children's summaries. Concurrency and rate
 * limiting are delegated to the ILlm implementation.
 */
export class SummaryGenerator {
  constructor(private readonly llm: ILlm) {}

  async generate(tree: Tree<TreeNodeData>): Promise<void> {
    const depths = tree.groupByDepth();

    // Leaves must be summarized before parents so that parent prompts
    // can include their children's already-generated summaries.
    const sortedDepths = this.sortDepthsInDecreasingOrder(depths);

    for (const depth of sortedDepths) {
      await this.summarizeLevel(depths.get(depth)!, tree);
    }
  }

  private async summarizeLevel(
    nodes: ITreeNode<TreeNodeData>[],
    tree: Tree<TreeNodeData>,
  ): Promise<void> {
    await Promise.all(nodes.map((node) => this.summarizeNode(node, tree)));
  }

  private async summarizeNode(
    node: ITreeNode<TreeNodeData>,
    tree: Tree<TreeNodeData>,
  ): Promise<void> {
    const prompt = tree.isLeaf(node)
      ? this.buildLeafPrompt(node)
      : this.buildParentPrompt(node);

    const result = await this.llm.callWithStructuredOutput(
      prompt,
      summarySchema,
    );
    node.data.summary = result.summary;
  }

  private buildLeafPrompt(node: ITreeNode<TreeNodeData>): string {
    return [
      "Summarize the following section of a document in 2-3 sentences.",
      `Section title: ${node.data.title}`,
      `Content:\n${node.data.text}`,
    ].join("\n\n");
  }

  private buildParentPrompt(node: ITreeNode<TreeNodeData>): string {
    const childSummaries = node.children
      .map((child) => `- ${child.data.title}: ${child.data.summary}`)
      .join("\n");

    return [
      "Summarize the following section of a document given its subsections. Write 2-3 sentences.",
      `Section title: ${node.data.title}`,
      `Subsections:\n${childSummaries}`,
    ].join("\n\n");
  }

  private sortDepthsInDecreasingOrder(
    levels: Map<number, ITreeNode<TreeNodeData>[]>,
  ): number[] {
    return Array.from(levels.keys()).sort((a, b) => b - a);
  }
}
