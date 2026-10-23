import { createWorkshopCopilotRuntime } from "./copilot-runtime.js";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { LiveTelemetry } from "./live-telemetry.js";
import { createFacilityServer } from "./server.js";
import { FacilityRepository } from "./repository.js";
import { createHistorianInvestigator } from "./investigate-historian.js";
import { HistorianQueryService } from "./historian-query.js";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const environmentPath = resolve(packageRoot, "../../../.env");
if (existsSync(environmentPath)) process.loadEnvFile(environmentPath);

const port = Number(process.env["FACILITY_PORT"] ?? "3101");
const databasePath = resolve(
  process.env["FACILITY_DB_PATH"] ??
    resolve(packageRoot, "data/facility.sqlite"),
);
const repository = new FacilityRepository(databasePath);
repository.initialize();
if (process.argv.includes("--reset-demo")) {
  repository.resetDemoData();
  repository.close();
  console.log(
    "Demo readings reset to the last seven days; alarms and approval records cleared.",
  );
  process.exit(0);
}
const telemetry = new LiveTelemetry(repository);
const investigate = createHistorianInvestigator(
  process.env["MASTRA_BASE_URL"] || "http://127.0.0.1:4211",
);
const historian = new HistorianQueryService(databasePath);
const { chat } = await import(
  new URL("../../../../workshop/exercises/chat.mts", import.meta.url).href
);
const server = createFacilityServer(
  repository,
  telemetry,
  investigate,
  historian,
  process.argv.includes("--local")
    ? undefined
    : createWorkshopCopilotRuntime({
        mastraBaseUrl:
          process.env["MASTRA_BASE_URL"] || "http://127.0.0.1:4211",
      }),
  chat,
);

server.listen(port, process.env["FACILITY_HOST"] ?? "127.0.0.1", () => {
  telemetry.start();
  console.log(`Facility service listening on http://127.0.0.1:${port}`);
  console.log(`SQLite database: ${databasePath}`);
});

const close = (): void => {
  telemetry.stop();
  server.close(() => {
    repository.close();
    process.exit(0);
  });
};

process.on("SIGINT", close);
process.on("SIGTERM", close);
