We are building a vectorless, reasoning-based RAG system that builds hierarchical tree indices from PDFs and retrieves information through LLM-driven tree search instead of vector similarity.

Use object oriented programming.

Follow SOLID principles.

Prefer camelCase over snake_case.

Add a comment block on every class describing its purpose (not implementation details).

This tool is LLM provider agnostic (ILlm interface). The current implementation uses Anthropic Claude via @langchain/anthropic.

Extract complex conditional logic into named private methods that clarify intent.
