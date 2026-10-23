// Instructor solution; participants write this in exercise 02.3.
import OpenAI from 'openai';
import { readFile, writeFile } from 'node:fs/promises';

const [inputPath, outputPath] = process.argv.slice(2);
const data = JSON.parse(await readFile(inputPath, 'utf8'));
const client = new OpenAI({
  baseURL: 'http://127.0.0.1:8080/v1',
  apiKey: '',
});

for (const chunk of data.chunks) {
  const result = await client.embeddings.create({
    model: 'workshop-embed',
    input: 'title: none | text: ' + chunk.text,
    encoding_format: 'float',
  });
  chunk.vector = result.data[0].embedding;
}

data.kind = 'embeddings';
data.embedding = {
  model: 'workshop-embed',
  documentPrefix: 'title: none | text: ',
};
await writeFile(outputPath, JSON.stringify(data, null, 2));
