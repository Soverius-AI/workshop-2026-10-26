# AI Engineering · Unit 3 solution

Install and start **Docker Desktop**. Allow **30 GB of free disk space**.

From this checkout’s root, run:

```sh
docker compose up
```

This prepares the applications and downloads **Gemma 12B** and **EmbeddingGemma**.

Wait for `download-models` to exit with **code 0**, then check that these pages open:

- [Incident management](http://localhost:4300)
- [RAG Lab Explorer](http://localhost:4341) — login: **operator / workshop**
- [llama-server](http://localhost:8080)
- [Mastra Studio](http://localhost:4211)

The other services keep running. Press **Ctrl+C** to stop; the downloaded models remain available for the workshop.

All branches include the same Docker services and dependencies. Preparation builds them once; switching to a solution branch does not require another package download. Cached models are reused without contacting Hugging Face. Local llama-server is the default; `.env.example` documents the optional OpenRouter settings.

Before Unit 1, copy `.env.example` to `.env`. Set `LLM_BASE_URL`, `LLM_MODEL` and `LLM_API_KEY` there for local llama.cpp or OpenRouter. The same settings apply to the client, Pi, incident chat, Explorer grounding and Mastra. `EMBED_*` configures the separate embedding model. Compose reads `.env` automatically. The Docker-local URL is `http://llama:8080/v1`; when running Node directly, use `http://localhost:8080/v1` and `node --env-file=.env`.

Run your TypeScript files with the prepared Node.js container:

```sh
docker compose run exercises node workshop/exercises/YOUR_FILE.mts
```

Edit files in your checkout; generated files appear there too. Keep the Docker images, volumes and `models/` directory. Clone this repository (rather than downloading a ZIP) while online so all solution branches are available offline.

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

Extract and chunk a PDF, then manually unload Gemma and load `workshop-embed` in llama-server:

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
docker compose up -d mastra incident-backend incident
```

The prepared Mastra container watches this branch's agent source. No package install or image rebuild is needed. The Studio listens on 4211 and the incident application on 4300. Set `FACILITY_CHAT_MODE=local` to return to the Unit 1 client.

OpenRouter is optional. Create an ignored `.env` with `LLM_BASE_URL=https://openrouter.ai/api/v1`, a valid `LLM_MODEL` and your `LLM_API_KEY`. The same settings apply to chat, SQL generation and review. Keep credentials out of Git. The local model needs no account or API key. `.env` selects the incident chat mode or optional provider overrides.

Progress events, frontend tools and the `review_alarm` approval interaction retain the webcast structure. Historian rows go directly to the UI; the conversational agent receives a completion message.

Local model quality, tool calling and performance still require a live rehearsal. A second review call to the same model is not an independent model or a security guarantee; deterministic execution policy remains the final gate.
