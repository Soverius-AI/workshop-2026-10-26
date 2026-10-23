import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'http://127.0.0.1:8080/v1',
  apiKey: '',
});

export async function chat(snapshot, question) {
  const result = await client.chat.completions.create({
    model: 'Gemma',
    messages: [
      { role: 'system', content: 'Answer using only the supplied factory snapshot. Identify missing information. Do not invent contacts, procedures, causes or product safety decisions. Keep the answer short.' },
      { role: 'user', content: JSON.stringify(snapshot) + '\n' + question },
    ],
    max_tokens: 500,
    temperature: 0,
  });
  return result.choices[0].message.content;
}

import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('incident.json', import.meta.url), 'utf8'));
console.log(await chat(snapshot, 'Summarise the observations and missing facts.'));
