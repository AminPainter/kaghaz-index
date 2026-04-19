# kaghaz-index

A vectorless, reasoning-based RAG system that builds hierarchical tree indices from PDFs. Instead of vector similarity, it retrieves information through LLM-driven tree search.

## How it works

The system processes a PDF through seven sequential stages to produce an enriched document tree:

1. **Page extraction** — Extracts per-page text and computes token counts from a PDF using `unpdf`
2. **TOC detection** — Uses an LLM to identify table of contents pages, detect whether page numbers are present, and determine the processing mode (page-number offset, fuzzy match, or synthetic TOC)
3. **TOC processing** — Extracts structured TOC entries, samples a subset to compute the offset between printed and physical page numbers via majority vote, then resolves all entries to physical PDF page indices
4. **TOC verification** — Verifies each entry's page mapping by checking whether the title appears on the resolved page. Incorrect entries are re-located using correct neighbors as anchors, retrying up to 3 times until accuracy reaches 100%
5. **Tree assembly** — Computes page ranges for each entry and builds a hierarchical tree using a stack-based algorithm that nests entries by heading depth (e.g. `2.3.1` under `2.3`)
6. **Tree enrichment** — Assigns sequential node IDs, attaches concatenated page text to leaf nodes, generates bottom-up summaries (leaves first, then parents from child summaries), and produces a single-sentence document description
7. **Index save** — Writes the enriched tree to disk as `<filename>.kaghaz-index.json` in the configured output directory (defaults to `./kaghaz-index-output`)

```
PDF → PageList → TocDetectionResult → ResolvedTocEntry[] → verified entries → Tree → enriched Tree → .kaghaz-index.json
```

## Install

```
npm install kaghaz-index
```

You'll need an Anthropic API key available at runtime (e.g. `ANTHROPIC_API_KEY` in your environment).

## Usage

Build an index from a PDF, then query it:

```ts
import { PageIndex, PageIndexRetriever, AnthropicLlm } from "kaghaz-index";

const llm = new AnthropicLlm({ apiKey: process.env.ANTHROPIC_API_KEY! });

const pageIndex = new PageIndex({ llm });
const tree = await pageIndex.build("./my-doc.pdf");

const retriever = new PageIndexRetriever({ llm, tree });
const result = await retriever.retrieve({ query: "What does section 3 cover?" });

console.log(result);
```

## Local development

```
pnpm install
pnpm example:index <path-to-pdf>
pnpm example:retrieve <path-to-index-json> "<query>"
```

Create a `.env` with `ANTHROPIC_API_KEY=...` for the examples.
