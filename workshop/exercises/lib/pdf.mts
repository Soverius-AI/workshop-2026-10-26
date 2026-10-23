import { readFile } from "node:fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import type {
  TextItem,
  TextMarkedContent,
} from "pdfjs-dist/types/src/display/api.js";

type PdfLine = {
  text: string;
  x: number;
  y: number;
  height: number;
  endX: number;
  breakBefore: boolean;
};

// PDF paragraph detection is a layout heuristic; tables and columns need inspection.
export function layoutLines(items: (TextItem | TextMarkedContent)[]) {
  const lines: PdfLine[] = [];
  let line: PdfLine | undefined;
  for (const item of items) {
    if (!("str" in item) || !item.str.trim()) continue;
    const x = item.transform[4],
      y = item.transform[5],
      height = Math.abs(item.height) || Math.abs(item.transform[3]) || 10;
    const same =
      line &&
      Math.abs(line.y - y) <= Math.max(3, height * 0.4) &&
      x >= line.endX - 3 &&
      x - line.endX < Math.max(25, height * 3);
    if (line && same) {
      const gap = x - line.endX;
      line.text += (gap > 0.1 ? " " : "") + item.str;
      line.endX = x + item.width;
    } else {
      const previous = lines.at(-1);
      const breakBefore =
        !previous ||
        previous.y - y > Math.max(previous.height, height) * 1.35 ||
        /^[•●▪]/.test(item.str.trim()) ||
        y > previous.y + height * 0.4 ||
        Math.abs(y - previous.y) < height * 0.4 ||
        Math.abs(height - previous.height) > height * 0.25;
      line = {
        text: item.str,
        x,
        y,
        height,
        endX: x + item.width,
        breakBefore,
      };
      lines.push(line);
    }
  }
  return lines;
}
export function paragraphsFromLines(lines: PdfLine[]) {
  const paragraphs = [];
  for (const line of lines) {
    if (!paragraphs.length || line.breakBefore)
      paragraphs.push(line.text.trim());
    else paragraphs[paragraphs.length - 1] += " " + line.text.trim();
  }
  return paragraphs.filter(Boolean);
}

export async function readPdf(path: string) {
  const pdf = await getDocument({
    data: new Uint8Array(await readFile(path)),
    verbosity: 0,
  }).promise;
  try {
    const pages = [];
    for (let number = 1; number <= pdf.numPages; number++) {
      const page = await pdf.getPage(number);
      const paragraphs = paragraphsFromLines(
        layoutLines((await page.getTextContent()).items),
      );
      pages.push({ page: number, text: paragraphs.join("\n\n") });
      page.cleanup();
    }
    return { source: path, totalPages: pdf.numPages, pages };
  } finally {
    await pdf.destroy();
  }
}
