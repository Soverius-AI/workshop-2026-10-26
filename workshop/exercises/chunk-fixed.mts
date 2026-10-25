import { readFile, writeFile } from "node:fs/promises";

const input = process.argv[2];
const output = process.argv[3];
const size = Number(process.argv[4] ?? 900);
const overlap = Number(process.argv[5] ?? 100);
const chunks = [];

const text = await readFile(input, "utf8");
for (let start = 0; start < text.length; start += size - overlap) {
  const body = text.slice(start, start + size);
  chunks.push({
    id: `${input}-${chunks.length + 1}`,
    source: input,
    text: body,
    characters: body.length,
    start,
    end: start + body.length,
  });
}

await writeFile(
  output,
  JSON.stringify(
    {
      schemaVersion: 1,
      kind: "chunks",
      settings: { strategy: "fixed", size, overlap, unit: "characters" },
      chunks,
    },
    null,
    2,
  ),
);
console.log(`Saved ${chunks.length} chunks to ${output}`);
