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

for (const chunk of data.chunks) {
  const result = await client.embeddings.create({
    model: process.env.EMBED_MODEL!,
    input: 'title: none | text: ' + chunk.text,
    encoding_format: 'float',
  });
  chunk.vector = result.data[0].embedding;
}

data.kind = 'embeddings';
data.embedding = {
  model: process.env.EMBED_MODEL!,
  documentPrefix: 'title: none | text: ',
};
await writeFile(outputPath, JSON.stringify(data, null, 2));
