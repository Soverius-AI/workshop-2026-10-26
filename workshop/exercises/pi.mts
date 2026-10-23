import { createWorkshopAgent } from './lib/pi.mts';

const session = await createWorkshopAgent();
await session.prompt(process.argv[2]);
console.log(session.getLastAssistantText());
session.dispose();
