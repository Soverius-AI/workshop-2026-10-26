# RAG Lab Explorer

Start from the repository root with `docker compose up`.
Open http://localhost:4341 and sign in as `operator` or `maintenance`, password `workshop`.

The Explorer visualizes your JSON chunks and embeddings, provides the PostgreSQL console and retrieval views, and includes the bonus model and permission comparisons. Document and question embeddings use BAAI BGE-M3 through OpenRouter. Chat generation uses the selected Gemma endpoint. Set the embedding key in the root `.env`.

Retrieval uses vector similarity over the participant’s imported PostgreSQL chunks. Replacing the imported embeddings clears the previous retrieval result. The Security view keeps the separate permission demonstration.

The incident backend can retrieve imported passages through `POST /api/retrieve` using the server-side `RAG_SERVICE_TOKEN`. This endpoint exposes only vector retrieval over the practice corpus; it cannot query protected documents or modify stored data.

Exercise instructions are provided separately on the participant website. Completed code is on `solution-unit-1` and `solution-unit-2`.
