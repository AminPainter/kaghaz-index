import "dotenv/config";
import { z } from "zod";
import { PageIndexRetriever, AnthropicLlm, type ILlm } from "../src";

const answerSchema = z.object({
  answer: z
    .string()
    .describe("A direct, concise answer to the user's question."),
  citations: z
    .array(z.string())
    .describe("Node IDs from the context that support the answer."),
});

type Answer = z.infer<typeof answerSchema>;

function buildAnswerPrompt(query: string, context: string): string {
  return [
    "You are a helpful assistant answering questions strictly from the provided context.",
    "If the context does not contain the answer, say so plainly instead of guessing.",
    "",
    "=== CONTEXT ===",
    context || "(no context retrieved)",
    "=== END CONTEXT ===",
    "",
    `User question: ${query}`,
  ].join("\n");
}

async function generateAnswer(
  llm: ILlm,
  query: string,
  context: string,
): Promise<Answer> {
  const prompt = buildAnswerPrompt(query, context);
  return llm.callWithStructuredOutput(prompt, answerSchema);
}

async function main() {
  const indexPath = process.argv[2];
  const query = process.argv.slice(3).join(" ");

  if (!indexPath || !query) {
    console.error("Usage: tsx examples/ask.ts <path-to-index-json> <query>");
    process.exit(1);
  }

  const llm = new AnthropicLlm();
  const retriever = new PageIndexRetriever({ llm });

  const retrieval = await retriever.retrieve({ query, indexPath });
  const { answer, citations } = await generateAnswer(
    llm,
    query,
    retrieval.context,
  );

  console.log(`Query: ${query}\n`);
  console.log("Answer:");
  console.log(answer);
  console.log("\nCitations:");
  console.log(citations.join(", ") || "(none)");
  console.log("\nRetrieved nodes:");
  for (const node of retrieval.resolvedNodes) {
    console.log(`  - ${node.nodeId}: ${node.title}`);
  }
}

main().catch(console.error);
