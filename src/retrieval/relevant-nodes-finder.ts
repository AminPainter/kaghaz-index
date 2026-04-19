import { z } from "zod";
import type { ILlm, ITreeNode } from "../types";
import type { StrippedNodeData } from "./tree-text-stripper";

const relevantNodesSchema = z.object({
  thinking: z
    .string()
    .describe("Reasoning about which nodes are relevant to the question"),
  nodeList: z
    .array(z.string())
    .describe("IDs of nodes likely to contain the answer"),
});

export type RelevantNodes = z.infer<typeof relevantNodesSchema>;

/**
 * Delegates relevant-node discovery to an LLM using structured output.
 * This is the single reasoning step of LLM tree search: the model
 * receives the stripped tree as JSON and returns the ids of the
 * nodes whose content should be pulled into the answer context.
 */
export class RelevantNodesFinder {
  constructor(private readonly llm: ILlm) {}

  async find(
    query: string,
    strippedTree: ITreeNode<StrippedNodeData>,
  ): Promise<RelevantNodes> {
    const prompt = this.buildPrompt(query, strippedTree);
    return this.llm.callWithStructuredOutput(prompt, relevantNodesSchema);
  }

  private buildPrompt(
    query: string,
    strippedTree: ITreeNode<StrippedNodeData>,
  ): string {
    return `You are given a question and a tree structure of a document.
Each node contains a node id, node title, and a corresponding summary.
Your task is to find all nodes that are likely to contain the answer to the question.

Question: ${query}

Document tree structure:
${JSON.stringify(strippedTree, null, 2)}

Reply with your reasoning in \`thinking\` and the relevant node ids in \`nodeList\`.`;
  }
}
