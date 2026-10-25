import { createRagAgent } from "./lib/rag-agent.mts";

process.loadEnvFile();

const session = await createRagAgent();

try {
  await session.prompt(process.argv[2]);
  console.log(session.getLastAssistantText());
} finally {
  await session.extensionRunner.emit({
    type: "session_shutdown",
    reason: "quit",
  });
  session.dispose();
}
