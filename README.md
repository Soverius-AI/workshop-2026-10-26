# AI Engineering · Participant preparation

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
