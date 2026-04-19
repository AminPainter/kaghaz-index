import type { PageList } from "../types";
import type { TreeNode } from "../../shared/data-structures/types";
import { Tree } from "../../shared/data-structures/tree";
import type { NodeIdWriter } from "./node-id-writer";
import type { NodeTextAttacher } from "./node-text-attacher";
import type { SummaryGenerator } from "./summary-generator";
import type { DocDescriptionGenerator } from "./doc-description-generator";

/**
 * Stage 6 orchestrator that enriches a bare skeleton tree with IDs,
 * raw text, LLM-generated summaries, and a document-level description.
 */
export class TreeEnricher {
  constructor(
    private readonly nodeIdWriter: NodeIdWriter,
    private readonly nodeTextAttacher: NodeTextAttacher,
    private readonly summaryGenerator: SummaryGenerator,
    private readonly docDescriptionGenerator: DocDescriptionGenerator,
  ) {}

  async enrich(root: TreeNode, pages: PageList): Promise<void> {
    const tree = new Tree(root);

    this.nodeIdWriter.write(tree);
    this.nodeTextAttacher.attach(tree, pages);
    await this.summaryGenerator.generate(tree);
    await this.docDescriptionGenerator.generate(tree);
  }
}
