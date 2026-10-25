import { createWorkshopAgent } from "./pi.mts";

export function createRagAgent(tools?: string[]) {
  return createWorkshopAgent(
    [
      (pi) => {
        pi.registerMcpServer("explorer", {
          url: process.env.RAG_MCP_URL!,
          headers: {
            Authorization: `Bearer ${process.env.RAG_SERVICE_TOKEN}`,
          },
          exposure: "direct",
        });
      },
    ],
    tools,
  );
}
