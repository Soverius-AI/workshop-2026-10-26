import OpenAI from "openai";

process.loadEnvFile();

const client = new OpenAI({
  baseURL: process.env.LLM_BASE_URL || 'http://localhost:8080/v1',
  apiKey: process.env.LLM_API_KEY,
});

const result = await client.chat.completions.create({
  model: process.env.LLM_MODEL!,
  messages: [
    {
      role: "system",
      content:
        "You are an Incident Management System for a chocolate factory. Answer only questions related to chocolate, the factory or its metrics.",
    },
    {
      role: "user",
      content: "The cooling room is too warm. What should I do?",
    },
  ],
});

console.log(result.choices[0].message.content);
