import { writeFile } from "node:fs/promises";
import { readPdf } from "./lib/pdf.mts";

const pdf = await readPdf(process.argv[2], Number(process.argv[4] ?? 1));
const text = pdf.pages
  .map((page) => `[PDF page ${page.page}]\n\n${page.text}`)
  .join("\n\n");
await writeFile(process.argv[3], text);
console.log(`Saved ${pdf.pages.length} pages to ${process.argv[3]}`);
