import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: process.env.LLM_BASE_URL,
  apiKey: process.env.LLM_API_KEY,
});

export async function chat(snapshot, question) {
  const result = await client.chat.completions.create({
    model: process.env.LLM_MODEL!,
    messages: [
      { role: 'system', content: 'Answer using only the supplied factory snapshot. Identify missing information. Do not invent contacts, procedures, causes or product safety decisions. Keep the answer short.' },
      { role: 'user', content: JSON.stringify(snapshot) + '\n' + question },
    ],
    max_tokens: 500,
    temperature: 0,
  });
  return result.choices[0].message.content;
}
