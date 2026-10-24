import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "http://127.0.0.1:8080/v1",
  apiKey: "",
});

const result = await client.chat.completions.create({
  model: "Gemma",
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
