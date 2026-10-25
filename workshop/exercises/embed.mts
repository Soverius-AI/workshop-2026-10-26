// Instructor solution; participants write this in exercise 02.3.
import OpenAI from 'openai';
import { readFile, writeFile } from 'node:fs/promises';

process.loadEnvFile();

const [inputPath, outputPath] = process.argv.slice(2);
const data = JSON.parse(await readFile(inputPath, 'utf8'));
const client = new OpenAI({
  baseURL: process.env.EMBED_BASE_URL,
  apiKey: process.env.EMBED_API_KEY,
});

for (let start = 0; start < data.chunks.length; start += 16) {
  const chunks = data.chunks.slice(start, start + 16);
  const result = await client.embeddings.create({
    model: process.env.EMBED_MODEL!,
    input: chunks.map(chunk => chunk.text),
    encoding_format: 'float',
  }, { timeout: 60000, maxRetries: 0 });
  chunks.forEach((chunk, index) => {
    chunk.vector = result.data[index].embedding;
  });
  console.log(`Embedded ${start + chunks.length}/${data.chunks.length} chunks`);
}

data.kind = 'embeddings';
data.embedding = { model: process.env.EMBED_MODEL!, documentPrefix: '' };
await writeFile(outputPath, JSON.stringify(data, null, 2));
