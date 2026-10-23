# AI Engineering · Participant preparation

Install and start **Docker Desktop** (or Docker Engine with Compose on Linux). From this checkout’s root, run:

```sh
docker compose up
```

This downloads the required images, builds the incident application and RAG Explorer locally, prepares Python 3.10 model inspection, and downloads:

- **Gemma 12B Q4_0** — approximately 7.22 GB.
- **EmbeddingGemma Q8_0** — approximately 334 MB.

Progress appears in your terminal. Model files stay in **models/**, outside Git. No vision projector is downloaded. Wait for the download container to exit with code 0 before loading a model in llama-server. Models stay unloaded until you select one in its UI.

Once startup finishes, open:

- **Incident management:** http://localhost:4300
- **RAG Lab Explorer:** http://localhost:4341 — **operator / workshop**.
- **llama-server:** http://localhost:8080.

PostgreSQL with pgvector is available at **localhost:5436**. The incident application uses SQLite. Both databases persist across container restarts.

Press **Ctrl+C** to stop. Run the same command again to restart and reuse cached downloads. Stop preparation before switching to the workshop starter in the same checkout; keep `models/` and the Docker images.

Plan for **16 GB RAM and 30 GB free disk space**. The complete 16 GB Windows setup still needs rehearsal.

No host Node.js or Python installation is needed for preparation. For writing code during the workshop, participants also need **Node.js 24, pnpm, Git and a code editor**. Python runs in Docker.

## Application source

- **apps/explorer/** — RAG Lab Explorer and its Dockerfile.
- **apps/incident-system/** — incident frontend, backend, Dockerfile and web-server configuration.

Shared contracts remain in `packages/contracts/`; workshop data and the baseline LLM client remain in `workshop/`.
