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

try {
  await session.prompt(process.argv[2]);
  console.log(session.getLastAssistantText());
} finally {
  await session.extensionRunner.emit({
    type: "session_shutdown",
    reason: "quit",
  });
  session.dispose();
}
