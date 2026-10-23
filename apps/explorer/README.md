# RAG Lab Explorer

A local workshop application: run editable Node scripts, then inspect their JSON output in the Explorer. PostgreSQL/pgvector holds the RAG practice corpus; the incident application keeps its existing SQLite database. Mastra is introduced in Unit 3, not required here.

## Start from the repository root

```sh
docker compose -f workshop/compose.yaml up -d explorer
```

Open http://localhost:4341. Accounts: `operator` and `maintenance`; default password for both: `workshop`. Passwords are hashed in memory, sessions use random tokens in HttpOnly/SameSite cookies, and sessions expire after 12 hours or a server restart. These are deliberately published local training credentials. The Compose ports bind to loopback. This is not a production identity service.

Docker Compose supplies PostgreSQL and the Explorer image. The same image runs the one-shot lab commands, with editable scripts mounted from the checkout and output written to `workshop/output`. The participant scripts require Node 24 on the host. Build again after changing backend/UI/data files. Script/library edits are mounted into lab runs immediately.

Docker uses a configurable `RAG_LAB_SUBNET` (default `10.203.44.0/24`), because the development machine had exhausted Docker's automatic network pools. Change it if it conflicts with a participant's VPN/network. Use `docker compose -f workshop/compose.yaml down` to stop; the database volume remains.

## Core exercises

```sh
node workshop/exercises/pdf-to-text.mts workshop/corpus/reference-documents/optyma-cooler.pdf optyma.txt
node workshop/exercises/chunk-fixed.mts optyma.txt fixed.json 900 100
node workshop/exercises/chunk-paragraph.mts optyma.txt paragraphs.json
docker compose -f workshop/compose.yaml run --rm lab store
```

1. **Chunks:** extract the project PDF with `pdf-to-text.mts`, then run `chunk-fixed.mts` and `chunk-paragraph.mts` as shown above. Upload each JSON file to the Explorer and compare text, source filename and boundaries. Fixed sizes and overlap are characters, not tokens; paragraph chunks split at blank lines. Semantic chunking is a planned optional bonus.
2. **Embeddings:** participants write `workshop/exercises/embed.mts`, using the OpenAI library directly to read their chunks, call the manually loaded embedding model and save the required artifact shape. See exercise 02.3 for the contract. Then upload `embeddings.json`, build a UMAP projection, click points, compare cosine neighbours. The map reduces to two dimensions; reported similarity uses all original dimensions. A fixed random seed makes a given run repeatable, not a scientific guarantee of cluster separation. At most 800 points are plotted; neighbour search uses all loaded vectors.
3. **PostgreSQL:** import the artifact in the UI or use `lab store`. Import atomically replaces the practice corpus. Use the console to INSERT, SELECT, inspect `vector_dims(embedding)` and compare vectors with `<=>` (cosine distance). Each console request has a separate restricted `lab_writer` connection; prepared protocol rejects multiple statements. The console is a local SQL playground, not an untrusted public SQL service.
4. **Retrieval:** ask “The cooling room is too warm. What should I do?” using vector search. Inspect the passages and SQL before generation. Compare keyword search with shorter terms such as “cooling”. PostgreSQL plain full-text queries combine terms; this is not BM25 or hybrid search. Exact search suits this small corpus; no HNSW/IVFFlat index is created.

The shared Explorer image contains no embedding-script solution or `lab embed` shortcut. Participants write their own script in 02.3; the completed script is available on `solution-unit-2`.

## Sources and preparation

`data/prepared-corpus.json` includes six fictional company documents and selected, prepared excerpts from two Danfoss manuals. PDF extraction is instructor preparation, not a participant task. Optyma excerpts preserve the parent symptom and individual cause/action rows from PDF page 6; AK-RC excerpts are from PDF page 5. They are not full-manual ingestion. The original URLs and document identifiers are in `../corpus/sources.json` and each prepared manual record.

Both original manuals are included in `workshop/corpus/reference-documents/`. Compose mounts that directory read-only at `/pdfs` for the Explorer and lab container. The lab guide links directly to the project PDFs; no participant download is needed. Manufacturer provenance is recorded in `../corpus/sources.json`.

To use another PDF, pass its path and an output text filename to `workshop/exercises/pdf-to-text.mts`. Then pass that text file and your chosen JSON filename to either chunking script. Relative paths resolve from your current directory. Extraction uses layout heuristics; check tables and reading order against the PDF. Scanned PDFs need OCR first.

The prepared mixed corpus remains available with `lab chunk` and no `--pdf`. To extend that curated corpus, prepare sections in its JSON format and rebuild the image. The supplied chunker accepts `--sources DANFOSS-OPTYMA,DANFOSS-AKRC` or `all`. Its `--sources` filter applies only to the prepared corpus and cannot be combined with `--pdf`.

## Chunking strategies

The participant exercise covers `fixed` and `paragraph`; semantic chunking is a planned optional bonus and has no runnable command yet. Bookmark-based `structure` remains available in the tool but is outside the exercise.

Both PDF wrappers accept `--strategy paragraph --overlap 0` (PowerShell: `-Strategy paragraph -Overlap 0`) or `structure` instead of `paragraph`. The lab command accepts the same long options. Omitting overlap for these strategies defaults to zero; a nonzero overlap is rejected. Existing `section` and `fixed` modes retain their previous behavior.

Paragraph mode uses PDF.js line positions and spacing to join wrapped lines into paragraph blocks. It packs whole blocks to the character target and flags `oversized` chunks instead of cutting a paragraph. Structure mode additionally matches the PDF's embedded bookmarks to headings on their destination pages. It preserves the heading with each resulting chunk and exposes `headingPath`, `boundary`, `paragraphStart` and `paragraphEnd`. All modes keep page provenance. This is bookmark-based structure support, not arbitrary table/heading reconstruction.

Both included PDFs work with paragraph mode. AK-RC supports structure mode: 22 of 23 bookmarks match; its stale final bookmark is reported and page 22 remains unsectioned. Optyma has no bookmarks; structure mode fails explicitly. See [the measured results and semantic-chunking proposal](../instructor/CHUNKING.md).

## Model connections

The browser visualizes artifacts. All model calls happen in Node through OpenAI-compatible HTTP endpoints. Compose includes a separate, pinned llama-server image with a web UI and manual model loading. Start it with `docker compose -f workshop/compose.yaml up -d llama` and open http://127.0.0.1:8080. See [the model setup](../llama/README.md). The Explorer image itself contains no model weights.

Copy `.env.example` to the repository-root `.env` if one does not already exist, or export the variables before Compose. Never overwrite an existing environment file. Configure:

- `EMBED_BASE_URL`: default `http://llama:8080/v1`; `EMBED_MODEL`, `EMBED_SPACE_ID`, `DOCUMENT_PREFIX`, `QUERY_PREFIX`.
- `CHAT_BASE_URL`: default `http://llama:8080/v1`, `CHAT_MODEL`.
- `RERANK_BASE_URL`: default port 8082, `RERANK_MODEL`; llama.cpp `/v1/rerank` response contract.

The model server must listen on an interface reachable from Docker; host loopback-only binding may not be reachable. Restrict access with the host firewall when exposing an inference listener. Linux uses the Compose host-gateway mapping. Qualify the model/server combination on participants' hardware before delivery. Model aliases are placeholders, not downloaded models. Changing models or preprocessing requires a new `EMBED_SPACE_ID`, re-embedding and re-importing. The API rejects mismatched dimensions and stored configuration.

Unlike the older file pipeline, these bonus views retrieve afresh per request. Vector retrieval needs embeddings running alongside the requested reranking/chat endpoint; protected keyword retrieval needs only the latter. No fake vectors, scores or generated answers are substituted when a model is unavailable.

## Bonus views and security boundary

- **Reranking:** score and reorder the retrieved candidates with a real reranker, showing before/after. It cannot recover missing candidates.
- **Grounding:** send at most three passages and show the exact messages alongside the answer. Check citations manually. A marked injection can be added to evidence to test behaviour. Prompt instructions are not a security guarantee; generation has no action tools.
- **Relationships:** follow explicit links up to two hops. This is a small curated document graph, not automatic entity extraction/GraphRAG. It is an inspectable extension; expanded passages are not silently merged into the retrieval pipeline.
- **Security:** sign in under each account and compare permitted documents, keyword retrieval, graph expansion and downstream model context. Separate non-owner PostgreSQL roles enforce row-level policies before evidence leaves the backend. The backend derives the role from the session, never from a model argument or uploaded metadata. The protected demonstration is pre-seeded with trusted text and uses keyword retrieval; it does not yet have a protected vector index.

Local artifact inspection and the practice schema intentionally expose participants' own synthetic files. JSON role labels do not grant database access. The SQL role cannot access protected tables, alter policies or assume an administrative role. The laptop owner can still inspect distributed files and local container credentials. No real restricted company records belong in this workshop.

Embedding uploads contain `embedding.model` and `embedding.documentPrefix`. The Explorer supplies `spaceId` and `queryPrefix` from its own settings when importing and searching; participant scripts do not include them. Legacy uploads may still contain these fields, but the Explorer ignores them. Model and document-prefix mismatches are rejected before replacing the practice corpus.
