import type { ITokenCounter, IPageExtractor, PageList } from "../types";

/**
 * Stage 1 entry point. Extracts per-page text from a document and
 * pairs each page with its approximate token count.
 */
export class PageIndexer {
  constructor(
    private readonly extractor: IPageExtractor,
    private readonly counter: ITokenCounter,
  ) {}

  async index(input: string | Buffer): Promise<PageList> {
    const pages = await this.extractor.extract(input);

    return pages.map((text) => ({
      text,
      tokenCount: this.counter.count(text),
    }));
  }
}
