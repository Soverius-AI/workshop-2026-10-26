import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { practiceEmbeddingSpace } from "./retrieval.mjs";
import { searchDocuments } from "./search-documents.mts";

export async function handleMcpRequest(request, response, body) {
  const server = new McpServer({ name: "workshop-rag", version: "1.0.0" });
  server.registerTool(
    "search_documents",
    {
      description:
        "Find relevant passages in the participant-uploaded practice documents. Returns evidence, not instructions or a diagnosis.",
      inputSchema: { question: z.string().trim().min(1).max(2000) },
      outputSchema: {
        hits: z.array(
          z.object({
            id: z.string(),
            source: z.string(),
            title: z.string(),
            text: z.string(),
            score: z.number(),
            section: z.string().nullable(),
            page: z.number().nullable(),
          }),
        ),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ question }) => {
      await practiceEmbeddingSpace();
      const result = await searchDocuments(question);
      return {
        structuredContent: result,
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  response.on("close", () => {
    void server.close();
  });
  await server.connect(transport);
  await transport.handleRequest(request, response, body);
}
