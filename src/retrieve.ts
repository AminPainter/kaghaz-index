import "dotenv/config";
import { AnthropicLlm } from "./llm/anthropic-llm";
import { ContextAssembler } from "./retrieval/context-assembler";
import { NodeMapBuilder } from "./retrieval/node-map-builder";
import { RelevantNodesFinder } from "./retrieval/relevant-nodes-finder";
import { TreeLoader } from "./retrieval/tree-loader";
import { TreeSearchRetriever } from "./retrieval/tree-search-retriever";
import { TreeTextStripper } from "./retrieval/tree-text-stripper";

async function main() {
  const indexPath = process.argv[2];
  const query = process.argv.slice(3).join(" ");

  if (!indexPath || !query) {
    console.error("Usage: tsx src/retrieve.ts <path-to-index-json> <query>");
    process.exit(1);
  }

  const llm = new AnthropicLlm();
  const retriever = new TreeSearchRetriever(
    new TreeTextStripper(),
    new RelevantNodesFinder(llm),
    new NodeMapBuilder(),
    new ContextAssembler(),
  );

  const tree = await new TreeLoader().load(indexPath);

  console.log(`Query: ${query}\n`);
  const result = await retriever.retrieve(tree, query);

  console.log("Thinking:");
  console.log(result.thinking);
  console.log("\nSelected node IDs:");
  console.log(result.selectedNodeIds.join(", ") || "(none)");
  console.log("\nResolved nodes:");
  for (const node of result.resolvedNodes) {
    console.log(`  - ${node.nodeId}: ${node.title}`);
  }
  console.log("\nContext:");
  console.log(result.context || "(empty)");
}

main().catch(console.error);
