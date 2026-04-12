import { z } from "zod";
import type { ILlm, TreeNodeData } from "../types";
import type { Tree } from "../tree";

const docDescriptionSchema = z.object({
  description: z
    .string()
    .describe("A single sentence describing what the document is"),
});

/**
 * Generates a single-sentence document description by sending the
 * enriched tree structure (titles and summaries only) to the LLM.
 */
export class DocDescriptionGenerator {
  constructor(private readonly llm: ILlm) {}

  async generate(tree: Tree<TreeNodeData>): Promise<void> {
    const treeJson = JSON.stringify(
      this.toSerializableStructure(tree),
      null,
      2,
    );

    const prompt = [
      "Given the following document structure, produce a single sentence describing what this document is.",
      `Structure:\n${treeJson}`,
    ].join("\n\n");

    const result = await this.llm.callWithStructuredOutput(
      prompt,
      docDescriptionSchema,
    );

    // TODO: Add a method on node object to set the document description instead of directly mutating the root's data
    tree.getRoot().data.docDescription = result.description;
  }

  private toSerializableStructure(tree: Tree<TreeNodeData>) {
    return tree.map((node, mappedChildren) => ({
      title: node.data.title,
      nodeId: node.data.nodeId,
      summary: node.data.summary,
      startIndex: node.data.startIndex,
      endIndex: node.data.endIndex,
      nodes: mappedChildren,
    }));
  }
}
