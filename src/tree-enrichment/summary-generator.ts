import { z } from "zod";
import type { ILlm, ITreeNode, TreeNodeData } from "../types";
import type { Tree } from "../tree";

const summarySchema = z.object({
  summary: z.string().describe("A concise 2-3 sentence summary of the section"),
});

const DEFAULT_CONCURRENCY = 10;

/**
 * Generates LLM summaries for every node in the tree using a bottom-up,
 * level-by-level approach. Leaf nodes are summarized from their raw text,
 * parent nodes from their children's summaries. Each level is processed
 * concurrently with a configurable concurrency limit.
 */
export class SummaryGenerator {
  constructor(
    private readonly llm: ILlm,
    private readonly concurrency: number = DEFAULT_CONCURRENCY,
  ) {}

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
    // Without batching, a level with 200 nodes would fire 200 LLM requests
    // simultaneously, overwhelming the API with rate limit errors. Batching
    // caps concurrent requests — each batch must complete before the next starts.
    for (let i = 0; i < nodes.length; i += this.concurrency) {
      const batch = nodes.slice(i, i + this.concurrency);
      await Promise.all(batch.map((node) => this.summarizeNode(node, tree)));
    }
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
