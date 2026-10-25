# AI Engineering · Unit 2 solution

Install and start **Docker Desktop**. Allow **30 GB of free disk space**.

From this checkout’s root, run:

```sh
docker compose up
```

This prepares the applications and downloads **Gemma 12B**.

Wait for `download-models` to exit with **code 0**, then check that these pages open:

- [Incident management](http://localhost:4300)
- [RAG Lab Explorer](http://localhost:4341) — login: **operator / workshop**
- [llama-server](http://localhost:8080)
- [Mastra Studio](http://localhost:4211) — empty until Unit 3

Gemma loads automatically on the first chat or API request; no manual model selection is needed.

The other services keep running. Press **Ctrl+C** to stop; the downloaded models remain available for the workshop.

Embeddings use **BAAI BGE-M3 through OpenRouter** for both documents and questions. Set `EMBED_API_KEY` in your ignored `.env`; internet access is required for embeddings and live retrieval. Gemma remains local.

All branches include the same Docker services and dependencies. Preparation builds them once; switching to a solution branch does not require another package download. Cached models are reused without contacting Hugging Face. Local llama-server is the default; `.env.example` documents the optional OpenRouter settings.

Before Unit 1, copy `.env.example` to `.env`. Set the `LLM_*` values there for local llama.cpp or OpenRouter. The same settings apply to the client, Pi, incident chat, Explorer grounding and Mastra. `EMBED_*` configures the separate embedding model. Compose reads `.env` automatically. The model scripts load `.env` themselves, so `node workshop/exercises/client.mts` works directly from the repository root. Use `http://localhost:8080/v1` for `LLM_BASE_URL`. Both embedding URLs use `https://openrouter.ai/api/v1`. Compose maps `LLM_DOCKER_BASE_URL` and `EMBED_DOCKER_BASE_URL` to the container settings; the local chat address is `http://llama:8080/v1`. For OpenRouter, set both LLM URLs to `https://openrouter.ai/api/v1`. The `/v1` suffix is required for the OpenAI-compatible llama.cpp endpoints.

Run your TypeScript files from the repository root:

```sh
node workshop/exercises/YOUR_FILE.mts
```

Or via Docker:

```sh
docker compose run exercises node workshop/exercises/YOUR_FILE.mts
```

Edit files in your checkout; generated files appear there too. Keep the Docker images, volumes and `models/` directory. Clone this repository (rather than downloading a ZIP) while online so all solution branches are available during the workshop.

## Code checkpoints

- `preparation`: shared setup, runtime helpers and supplied PDF/chunking utilities.
- `solution-unit-1`: completed Unit 1; start Unit 2 from here.
- `solution-unit-2`: completed Unit 2 exercises.
- `solution-unit-3`: final application for the Unit 3 walkthrough.

Slides and exercise instructions are provided on the participant website. The presenter desk is private.

## Run the Unit 1 code

From the repository root, run your files:

```sh
node workshop/exercises/client.mts
node workshop/exercises/pi.mts "Read workshop/corpus/company-documents/cooling-room-incident.md and write a short factual summary to factory-summary.txt."
```

Or via Docker:

```sh
docker compose run exercises node workshop/exercises/client.mts
docker compose run exercises node workshop/exercises/pi.mts "Read workshop/corpus/company-documents/cooling-room-incident.md and write a short factual summary to factory-summary.txt."
```

For local inference, load Gemma manually in http://localhost:8080 first. The provided `pdf-to-text.mts`, `chunk-fixed.mts` and `chunk-paragraph.mts` utilities are used during Unit 2. The completed embedding script is on `solution-unit-2`.

## Run the Unit 2 code

Extract and chunk a PDF, then embed it with the OpenRouter settings in `.env`:

```sh
node workshop/exercises/pdf-to-text.mts workshop/corpus/reference-documents/optyma-cooler.pdf optyma.txt
node workshop/exercises/chunk-paragraph.mts optyma.txt optyma-paragraph.json
node workshop/exercises/embed.mts optyma-paragraph.json embeddings.json
```

Or via Docker:

```sh
docker compose run exercises node workshop/exercises/pdf-to-text.mts workshop/corpus/reference-documents/optyma-cooler.pdf optyma.txt
docker compose run exercises node workshop/exercises/chunk-paragraph.mts optyma.txt optyma-paragraph.json
docker compose run exercises node workshop/exercises/embed.mts optyma-paragraph.json embeddings.json
```

Upload `embeddings.json` to the Explorer. Use its PostgreSQL console and retrieval views to store and search the passages. This branch includes all Unit 1 code.

## Complete the MCP server and use it from Pi

`apps/explorer/lib/search-documents.mts` contains the completed question-embedding and pgvector query. The supplied server calls it for `search_documents`. Restart Explorer after edits; the source folder is mounted.

`workshop/exercises/pi-rag.mts` reuses the Unit 1 Pi helper and registers Explorer with Pi’s built-in MCP support. Pi discovers the search tool directly from the server:

```sh
node workshop/exercises/pi-rag.mts "Use search_documents and write the answer into rag-answer.txt for: The cooling room is too warm. What should I do?"
```

Or via Docker:

```sh
docker compose run exercises node workshop/exercises/pi-rag.mts "Use search_documents and write the answer into rag-answer.txt for: The cooling room is too warm. What should I do?"
```

Pi discovers mcp__explorer__search_documents from Explorer. The CLI retains the Unit 1 file tools and can write an answer file.

## Connect the incident chat to RAG

After importing the OpenRouter embeddings in Explorer, start `docker compose up llama postgres explorer incident-backend incident` and load Gemma manually. Open http://localhost:4300/?unit=2. The supplied RAG chat component calls `/api/rag-chat`. Its `chat-rag.mts` function uses the same Pi setup and MCP registration as `pi-rag.mts`, passes the question and selected measurement, and returns the answer. Pi handles the model/tool loop. Unit 1 remains available at http://localhost:4300/?unit=1; no backend mode switch is needed.

Unit 1 uses `/api/chat` with the measurement snapshot. Unit 2 uses `/api/rag-chat`. The MCP client setup and dependencies are supplied in preparation.

The MCP transport is supplied. In Unit 2, complete `apps/explorer/lib/search-documents.mts`, then connect Pi and reuse that agent in the incident backend. Explorer mounts its `lib` folder so code edits require a restart, not an image rebuild. The completed retrieval, incident chat and Pi scripts belong to `solution-unit-2`.
