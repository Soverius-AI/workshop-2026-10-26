import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const searchDocumentsTool = createTool({
  id: 'search_documents',
  description: 'Retrieve passages from the documents imported in RAG Lab Explorer. Use for factory procedures, equipment guidance and what-to-do questions. Returns evidence, not a diagnosis or authorization to act.',
  inputSchema: z.object({ question: z.string().min(1).max(2000) }),
  outputSchema: z.object({ hits: z.array(z.object({
    id: z.string(), title: z.string(), source: z.string(), text: z.string(), score: z.number(),
  })) }),
  execute: async ({ question }) => {
    const response = await fetch(process.env['RAG_BASE_URL'] + '/api/retrieve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + process.env['RAG_SERVICE_TOKEN'],
      },
      body: JSON.stringify({ question }),
      signal: AbortSignal.timeout(90000),
    });
    if (!response.ok) throw new Error('Document retrieval failed: HTTP ' + response.status);
    const result = await response.json();
    return { hits: result.hits };
  },
});
