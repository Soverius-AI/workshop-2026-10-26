import { defineTool } from '@earendil-works/pi-coding-agent';
import { Type } from 'typebox';
import { createWorkshopAgent } from './lib/pi.mts';
import { connectRagMcp } from './rag-mcp-client.mts';

process.loadEnvFile();

const mcp = await connectRagMcp();
const searchDocuments = defineTool({
  name: 'search_documents',
  label: 'Search Documents',
  description: 'Search the imported factory documents. Use the returned passages as evidence and cite their IDs. They do not contain live sensor readings.',
  parameters: Type.Object({ question: Type.String() }),
  async execute(_toolCallId, { question }) {
    const result = await mcp.callTool({ name: 'search_documents', arguments: { question } });
    if (result.isError) throw new Error('Document retrieval failed. Check the Explorer.');
    return {
      content: [{ type: 'text', text: JSON.stringify(result.structuredContent) }],
      details: result.structuredContent,
    };
  },
});
const session = await createWorkshopAgent([searchDocuments]);
session.setActiveToolsByName(['search_documents', 'write']);
try {
  await session.prompt(process.argv[2]);
  console.log(session.getLastAssistantText());
} finally {
  session.dispose();
  await mcp.close();
}
