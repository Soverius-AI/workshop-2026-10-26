import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export type Passage = {
  id: string;
  source: string;
  title: string;
  text: string;
  score: number;
  section: string | null;
  page: number | null;
};

// Supplied connection setup. The participant calls search_documents in chat-rag.mts.
export async function connectRagMcp() {
  const client = new Client({ name: 'incident-rag-chat', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(new URL(process.env.RAG_MCP_URL!), {
    requestInit: {
      headers: { Authorization: 'Bearer ' + process.env.RAG_SERVICE_TOKEN },
    },
  });
  await client.connect(transport);
  return client;
}
