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

The other services keep running. Press **Ctrl+C** to stop; the downloaded models remain available for the workshop.

Local llama-server is the default. Optional OpenRouter settings are documented in `.env.example`; no cloud key is needed for the local exercises.

## Code checkpoints

- `preparation`: shared setup and supplied runtime helpers.
- `solution-unit-1`: completed Unit 1; start Unit 2 from here.
- `solution-unit-2`: completed Unit 2; start Unit 3 from here.
- `solution-unit-3`: AI DevCraft incident application with the completed Mastra/SQL and UI integrations.

Slides and exercise instructions are provided on the participant website. The presenter desk is private.

## Run the Unit 1 code

Install Node.js 24.12 or newer, then run from the repository root:

```sh
npm ci --prefix workshop/exercises
node workshop/exercises/client.mts
node workshop/exercises/pi.mts "Read workshop/corpus/company-documents/cooling-room-incident.md and write a short factual summary to factory-summary.txt."
```

Load Gemma manually in http://localhost:8080 first. The provided `pdf-to-text.mts`, `chunk-fixed.mts` and `chunk-paragraph.mts` utilities are used during Unit 2. The completed embedding script is on `solution-unit-2`.

## Run the Unit 2 code

Extract and chunk a PDF, then manually unload Gemma and load `workshop-embed` in llama-server:

```sh
node workshop/exercises/pdf-to-text.mts workshop/corpus/reference-documents/optyma-cooler.pdf optyma.txt
node workshop/exercises/chunk-paragraph.mts optyma.txt optyma-paragraph.json
node workshop/exercises/embed.mts optyma-paragraph.json embeddings.json
```

Upload `embeddings.json` to the Explorer. Use its PostgreSQL console and retrieval views to store and search the passages. This branch includes all Unit 1 code.

## AI DevCraft application · Unit 3

This checkpoint adapts AI DevCraft commit `021033c11b5549d95fd35f698a3049e74332a2c4` to the workshop layout. The conversation, SQL generation and SQL review use the same configured model. The default is Gemma through the local Docker llama-server at http://127.0.0.1:8080/v1, with no API key.

The four-stage workflow is SQL generation → deterministic preflight → model review → facility-owned validation and execution. Jev and its hosted decisions endpoint are removed. Reviewer errors stop the query; there is no automatic approval or cloud fallback.

Load Gemma manually in llama-server. From this checkout's root:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

If the preparation Docker frontend occupies port 4300, stop only that frontend with `docker compose stop incident` before running the native frontend. The Mastra service listens on 4211; the native facility backend uses 3101.

OpenRouter is optional. Create an ignored `.env` with `LLM_BASE_URL=https://openrouter.ai/api/v1`, a valid `LLM_MODEL` and your `LLM_API_KEY`. The same settings apply to chat, SQL generation and review. Keep credentials out of Git. The local default works without `.env` or an account.

Progress events, frontend tools and the `review_alarm` approval interaction retain the webcast structure. Historian rows go directly to the UI; the conversational agent receives a completion message.

Local model quality, tool calling and performance still require a live rehearsal. A second review call to the same model is not an independent model or a security guarantee; deterministic execution policy remains the final gate.
