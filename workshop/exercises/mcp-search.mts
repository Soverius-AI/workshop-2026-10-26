import { connectRagMcp } from './rag-mcp-client.mts';

process.loadEnvFile();

const mcp = await connectRagMcp();
try {
  const result = await mcp.callTool({
    name: 'search_documents',
    arguments: { question: process.argv[2] },
  });
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.isError ? 1 : 0;
} finally {
  await mcp.close();
}
