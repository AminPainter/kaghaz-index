# kaghaz-index

A vectorless, reasoning-based RAG system that builds hierarchical tree indices from PDFs. Instead of vector similarity, it retrieves information through LLM-driven tree search.

## How it works

1. **Page extraction** — Extracts per-page text and token counts from a PDF
2. **TOC detection** — Uses an LLM to identify table of contents pages and determine the processing mode
3. **TOC processing** — Extracts structured TOC entries and resolves printed page numbers to physical PDF page indices

## Setup

```
npm install
```

Create a `.env` file with your Anthropic API key:

```
ANTHROPIC_API_KEY=your-key-here
```

## Usage

```
npm run dev -- <path-to-pdf>
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run with tsx |
| `npm run build` | Bundle for production |
| `npm run typecheck` | Type-check with tsc |
| `npm start` | Run the production build |
