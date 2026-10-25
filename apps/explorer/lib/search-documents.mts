import { practice } from './database.mjs';
import { embedTexts } from './artifacts.mjs';
import type { Passage } from '../../../workshop/exercises/rag-mcp-client.mts';

export async function searchDocuments(question: string): Promise<{ hits: Passage[] }> {
  // Exercise 02.6: embed the question, query practice.chunks and return { hits: rows }.
  throw new Error('Complete searchDocuments in exercise 02.6 before calling the MCP tool.');
}
