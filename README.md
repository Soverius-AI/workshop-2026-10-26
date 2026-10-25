# AI Engineering · Participant preparation

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

Unit 1 uses `/api/chat` with the measurement snapshot. Unit 2 uses `/api/rag-chat`; its separate RAG view calls the Explorer MCP tool `search_documents` before sending the retrieved text to Gemma. The MCP client setup and dependencies are supplied in preparation.
