import { readFile, writeFile } from "node:fs/promises";

const input = process.argv[2];
const output = process.argv[3];

const text = await readFile(input, "utf8");
const chunks = text
  .trim()
  .split(/\r?\n\s*\r?\n/)
  .filter((paragraph) => paragraph.trim())
  .map((text, index) => ({
    id: `${input}-${index + 1}`,
    source: input,
    text,
    characters: text.length,
    paragraph: index + 1,
  }));

await writeFile(
  output,
  JSON.stringify(
    {
      schemaVersion: 1,
      kind: "chunks",
      settings: { strategy: "paragraph", overlap: 0 },
      chunks,
    },
    null,
    2,
  ),
);
console.log(`Saved ${chunks.length} chunks to ${output}`);
