# AI Engineering · Unit 1 solution

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

Unit 1 uses `/api/chat` with the measurement snapshot. Unit 2 uses `/api/rag-chat`; its separate RAG view calls the Explorer MCP tool `search_documents` before sending the retrieved text to Gemma. The MCP client setup and dependencies are supplied in preparation.

The MCP transport is supplied. In Unit 2, complete `apps/explorer/lib/search-documents.mts`, then use the tool from the incident backend and Pi. Explorer mounts its `lib` folder so code edits require a restart, not an image rebuild. The completed retrieval, incident chat and Pi scripts belong to `solution-unit-2`.
