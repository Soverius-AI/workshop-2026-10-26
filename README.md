# AI Engineering · Unit 1 solution

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

Slides and exercise instructions are provided on the participant website. The presenter desk is private.

## Run the Unit 1 code

Install Node.js 24.12 or newer, then run from the repository root:

```sh
npm ci --prefix workshop/exercises
node workshop/exercises/client.mts
node workshop/exercises/pi.mts "Read workshop/corpus/company-documents/cooling-room-incident.md and write a short factual summary to factory-summary.txt."
```

Load Gemma manually in http://localhost:8080 first. The provided `pdf-to-text.mts`, `chunk-fixed.mts` and `chunk-paragraph.mts` utilities are used during Unit 2. The completed embedding script is on `solution-unit-2`.
