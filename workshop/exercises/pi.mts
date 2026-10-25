import { createWorkshopAgent } from "./lib/pi.mts";

process.loadEnvFile();

const session = await createWorkshopAgent();
const task = process.argv[2];

await session.prompt(task);
console.log(session.getLastAssistantText());
session.dispose();
