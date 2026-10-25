import { createWorkshopAgent } from "./lib/pi.mts";

process.loadEnvFile();

const session = await createWorkshopAgent([
  (pi) => {
    pi.registerMcpServer("explorer", {
      url: process.env.RAG_MCP_URL!,
      headers: {
        Authorization: `Bearer ${process.env.RAG_SERVICE_TOKEN}`,
      },
      exposure: "direct",
    });
  },
]);

await session.prompt(process.argv[2]);
console.log(session.getLastAssistantText());
session.dispose();
