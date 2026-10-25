# AI Engineering · Unit 3 solution

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
- [Mastra Studio](http://localhost:4211)

The other services keep running. Press **Ctrl+C** to stop; the downloaded models remain available for the workshop.

Embeddings use **BAAI BGE-M3 through OpenRouter** for both documents and questions. Set `EMBED_API_KEY` in your ignored `.env`; internet access is required for embeddings and live retrieval. Gemma remains local.

All branches include the same Docker services and dependencies. Preparation builds them once; switching to a solution branch does not require another package download. Cached models are reused without contacting Hugging Face. Local llama-server is the default; `.env.example` documents the optional OpenRouter settings.

Before Unit 1, copy `.env.example` to `.env`. Set the `LLM_*` values there for local llama.cpp or OpenRouter. The same settings apply to the client, Pi, incident chat, Explorer grounding and Mastra. `EMBED_*` configures the separate embedding model. Compose reads `.env` automatically. The model scripts load `.env` themselves, so `node workshop/exercises/client.mts` works directly from the repository root. Use `http://localhost:8080/v1` for `LLM_BASE_URL`. Both embedding URLs use `https://openrouter.ai/api/v1`. Compose maps `LLM_DOCKER_BASE_URL` and `EMBED_DOCKER_BASE_URL` to the container settings; the local chat address is `http://llama:8080/v1`. For OpenRouter, set both LLM URLs to `https://openrouter.ai/api/v1`. The `/v1` suffix is required for the OpenAI-compatible llama.cpp endpoints.

Run your TypeScript files with the prepared Node.js container:

```sh
docker compose run exercises node workshop/exercises/YOUR_FILE.mts
```

Edit files in your checkout; generated files appear there too. Keep the Docker images, volumes and `models/` directory. Clone this repository (rather than downloading a ZIP) while online so all solution branches are available during the workshop.

## Code checkpoints

- `preparation`: shared setup, runtime helpers and supplied PDF/chunking utilities.
- `solution-unit-1`: completed Unit 1; start Unit 2 from here.
- `solution-unit-2`: completed Unit 2; start Unit 3 from here.
- `solution-unit-3`: AI DevCraft incident application with the completed Mastra/SQL and UI integrations.

Slides and exercise instructions are provided on the participant website. The presenter desk is private.

## Run the Unit 1 code

From the repository root, run your files with the prepared Node container:

```sh
docker compose run exercises node workshop/exercises/client.mts
docker compose run exercises node workshop/exercises/pi.mts "Read workshop/corpus/company-documents/cooling-room-incident.md and write a short factual summary to factory-summary.txt."
```

For local inference, load Gemma manually in http://localhost:8080 first. The provided `pdf-to-text.mts`, `chunk-fixed.mts` and `chunk-paragraph.mts` utilities are used during Unit 2. The completed embedding script is on `solution-unit-2`.

## Run the Unit 2 code

Extract and chunk a PDF, then embed it with the OpenRouter settings in `.env`:

```sh
docker compose run exercises node workshop/exercises/pdf-to-text.mts workshop/corpus/reference-documents/optyma-cooler.pdf optyma.txt
docker compose run exercises node workshop/exercises/chunk-paragraph.mts optyma.txt optyma-paragraph.json
docker compose run exercises node workshop/exercises/embed.mts optyma-paragraph.json embeddings.json
```

Upload `embeddings.json` to the Explorer. Use its PostgreSQL console and retrieval views to store and search the passages. This branch includes all Unit 1 code.

## AI DevCraft application · Unit 3

This checkpoint adapts AI DevCraft commit `021033c11b5549d95fd35f698a3049e74332a2c4` to the workshop layout. The conversation, SQL generation and SQL review use the same configured model. The default is Gemma through the local Docker llama-server at http://127.0.0.1:8080/v1, with no API key.

The four-stage workflow is SQL generation → deterministic preflight → model review → facility-owned validation and execution. Jev and its hosted decisions endpoint are removed. Reviewer errors stop the query; there is no automatic approval or cloud fallback.

Load Gemma manually in llama-server. Set `FACILITY_CHAT_MODE=mastra` in the root `.env`, then run:

```sh
docker compose up mastra incident-backend incident
```

The prepared Mastra container watches this branch's agent source. No package install or image rebuild is needed. The Studio listens on 4211 and the incident application on 4300. Set `FACILITY_CHAT_MODE=local` to return to the Unit 1 client.

OpenRouter is optional. Create an ignored `.env` with `LLM_BASE_URL=https://openrouter.ai/api/v1`, a valid `LLM_MODEL` and your `LLM_API_KEY`. The same settings apply to chat, SQL generation and review. Keep credentials out of Git. The local model needs no account or API key. `.env` selects the incident chat mode or optional provider overrides.

Progress events, frontend tools and the `review_alarm` approval interaction retain the webcast structure. Historian rows go directly to the UI; the conversational agent receives a completion message.

Local model quality, tool calling and performance still require a live rehearsal. A second review call to the same model is not an independent model or a security guarantee; deterministic execution policy remains the final gate.
## Connect the incident chat to RAG

After importing the OpenRouter embeddings in Explorer, start `docker compose up llama postgres explorer incident-backend incident` and load Gemma manually. Open http://localhost:4300/?unit=2. The separate RAG chat calls the Explorer MCP tool `search_documents` before asking Gemma to answer. Expand MCP Tool Call, Retrieved Passages and Messages Sent to Gemma. Unit 1 remains available at http://localhost:4300/?unit=1; no backend mode switch is needed.

Unit 1 uses `/api/chat` with the measurement snapshot. Unit 2 uses `/api/rag-chat`. The MCP client setup and dependencies are supplied in preparation.

The MCP transport is supplied. In Unit 2, complete `apps/explorer/lib/search-documents.mts`, then use the tool from the incident backend and Pi. Explorer mounts its `lib` folder so code edits require a restart, not an image rebuild. The completed retrieval, incident chat and Pi scripts belong to `solution-unit-2`.

## Complete the MCP server and use it from Pi

`apps/explorer/lib/search-documents.mts` contains the completed question-embedding and pgvector query. The supplied server calls it for `search_documents`. Restart Explorer after edits; the source folder is mounted.

`workshop/exercises/pi-rag.mts` reuses the Unit 1 Pi helper and forwards its document-search tool to that MCP server:

```sh
docker compose run exercises node workshop/exercises/pi-rag.mts "Use search_documents for: The cooling room is too warm. What should I do? Write a short answer with passage citations to rag-answer.txt. Do not invent live readings or contacts."
```

The incident backend calls retrieval explicitly. Pi lets Gemma select the tool, then uses its result to write the answer file.
