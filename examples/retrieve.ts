import "dotenv/config";
import { PageIndexRetriever, AnthropicLlm } from "../src";

async function main() {
  const indexPath = process.argv[2];
  const query = process.argv.slice(3).join(" ");

  if (!indexPath || !query) {
    console.error(
      "Usage: tsx examples/retrieve.ts <path-to-index-json> <query>",
    );
    process.exit(1);
  }

  const retriever = new PageIndexRetriever({ llm: new AnthropicLlm() });
  const result = await retriever.retrieve({ query, indexPath });

  console.log(`Query: ${query}\n`);
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
