import { Mastra } from "@mastra/core/mastra";

// Register your agent here in Unit 3.
export const mastra = new Mastra({
  server: {
    host: process.env["MASTRA_HOST"] || "127.0.0.1",
    port: Number(process.env["MASTRA_PORT"] || "4211"),
  },
  agents: {},
});
