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

This checkpoint restores the incident-management agent from AI DevCraft commit `021033c11b5549d95fd35f698a3049e74332a2c4` (`source/ai-devcraft-2026-09-30`). The agent workspace moved from `apps/agent-service` to `apps/incident-system/agent`; relative configuration paths and cross-platform launch commands were adjusted. Agent, tool, SQL generator, reviewer, workflow and schema implementations are unchanged.

The original application uses OpenRouter for the conversational and SQL-generation agents, and Jev for semantic SQL review. These are hosted requests and require your own OpenRouter key. Do not put the key in Git.

Create `.env` using `.env.example` as the template, or update your existing `.env`. Put your key in it before starting. From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

 The supplied application scripts follow the webcast's development setup; the Mastra service runs at port 4211 and the incident frontend at 4300.

The preparation stack also uses port 4300 for the Docker incident frontend. Stop only that frontend with `docker compose stop incident` before running the native frontend. PostgreSQL, Explorer and llama-server can remain running. If your Docker incident-backend is running, the native application starts a separate local SQLite backend on port 3101.

The reviewed historian workflow has four stages:

1. Generate a structured SQL proposal with the dedicated SQL agent.
2. Reject prohibited SQL deterministically before review.
3. Review meaning and intent with Jev.
4. Apply the review decision, then validate and execute the exact query through the facility service.

Progress events feed the existing UI. The application also exposes frontend view/filter tools and the `review_alarm` human-approval interaction. The original chat agent receives a completion message, while historian results are displayed directly in the UI.

This restores the webcast implementation. It does not claim a fresh live-model rehearsal or add a RAG tool to the conversational agent.
