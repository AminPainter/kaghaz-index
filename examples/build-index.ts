import "dotenv/config";
import { PageIndex, AnthropicLlm } from "../src";

async function main() {
  const pdfPath = process.argv[2];
  if (!pdfPath) {
    console.error("Usage: tsx examples/build-index.ts <path-to-pdf>");
    process.exit(1);
  }

  const llm = new AnthropicLlm();
  const pageIndex = new PageIndex({ llm });

  console.log(`Processing: ${pdfPath}`);
  await pageIndex.build(pdfPath, { outputDir: "./kaghaz-index-output" });
  console.log("Done. Index written to ./kaghaz-index-output/");
}

main().catch(console.error);
