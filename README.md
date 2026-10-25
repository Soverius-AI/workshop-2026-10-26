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
- `solution-unit-3`: completed Unit 3.

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

## Connect the incident chat to RAG

After importing the OpenRouter embeddings in Explorer, start `docker compose up llama postgres explorer incident-backend incident` and load Gemma manually. Open http://localhost:4300/?unit=2. The separate RAG chat calls the Explorer MCP tool `search_documents` before asking Gemma to answer. Expand MCP Tool Call, Retrieved Passages and Messages Sent to Gemma. Unit 1 remains available at http://localhost:4300/?unit=1; no backend mode switch is needed.

Unit 1 uses `/api/chat` with the measurement snapshot. Unit 2 uses `/api/rag-chat`. The MCP client setup and dependencies are supplied in preparation.
