# RAG Lab Explorer

Start from the repository root with `docker compose up`.
Open http://localhost:4341 and sign in as `operator` or `maintenance`, password `workshop`.

The Explorer visualizes your JSON chunks and embeddings, provides the PostgreSQL console and retrieval views, and includes the bonus model and permission comparisons. It calls the embedding and chat models through the shared llama-server container.

Retrieval uses vector similarity over the participant’s imported PostgreSQL chunks. Replacing the imported embeddings clears the previous retrieval result. The Security view keeps the separate permission demonstration.

Exercise instructions are provided separately on the participant website. Completed code is on `solution-unit-1` and `solution-unit-2`.
