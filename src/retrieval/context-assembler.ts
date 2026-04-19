import type { TreeNode } from "../shared/data-structures/types";
import type { ResolvedNode } from "./types";

/**
 * Resolves the node ids returned by the LLM back into concrete
 * document text and concatenates them into the retrieval context.
 * Unknown ids (hallucinations) are skipped silently so a malformed
 * response never crashes retrieval.
 */
export class ContextAssembler {
  assemble(
    nodeIds: string[],
    nodeMap: Map<string, TreeNode>,
  ): { resolvedNodes: ResolvedNode[]; context: string } {
    const resolvedNodes: ResolvedNode[] = [];

    for (const nodeId of nodeIds) {
      const node = nodeMap.get(nodeId);
      if (!node) continue;

      resolvedNodes.push({
        nodeId,
        title: node.data.title,
        text: node.data.text ?? "",
      });
    }

    const context = resolvedNodes
      .map((r) => r.text)
      .filter((t) => t.length > 0)
      .join("\n\n");

    return { resolvedNodes, context };
  }
}
