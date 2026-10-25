import { createWorkshopAgent } from "./lib/pi.mts";

export async function chat(snapshot: unknown, question: string) {
  const session = await createWorkshopAgent(
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
    ["mcp__explorer__search_documents"],
  );

  await session.prompt(
    `Use search_documents to answer briefly: ${question}\nMeasurement: ${JSON.stringify(snapshot)}`,
  );
  const answer = session.getLastAssistantText() ?? null;
  session.dispose();
  return answer;
}
