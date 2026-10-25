import { readFile, stat } from "node:fs/promises";
import { basename } from "node:path";
import { createHash } from "node:crypto";
import { PDFParse } from "pdf-parse";

export async function readPdfCorpus(
  path,
  sourceName,
  { strategy = "section" } = {},
) {
  if ((await stat(path)).size > 50 * 1024 * 1024)
    throw Error("PDF exceeds the 50 MB lab limit.");
  const bytes = await readFile(path);
  if (!bytes.subarray(0, 1024).includes(Buffer.from("%PDF-")))
    throw Error("The selected file is not a PDF.");
  const name = basename(String(sourceName ?? path).replaceAll("\\", "/"));
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const parser = new PDFParse({ data: bytes });
  try {
    const layout = ["paragraph", "structure"].includes(strategy)
      ? await (
          await import("./pdf-layout.mjs")
        ).readLayout(bytes, { structure: strategy === "structure" })
      : null;
    const result = layout ?? (await parser.getText());
    const sections =
      layout?.sections ??
      result.pages
        .filter((p) => p.text.trim())
        .map((p) => ({
          heading: `PDF page ${p.num}`,
          page: p.num,
          text: p.text.trim(),
        }));
    if (!sections.length)
      throw Error(
        "No selectable text found. Use a text-based PDF; scanned pages need OCR first.",
      );
    return {
      input: {
        kind: "pdf",
        name,
        sha256,
        pages: result.pages.length,
        skippedPages: result.pages
          .filter((p) => !p.text.trim())
          .map((p) => p.num),
        extraction: layout ? "pdfjs-dist 5.4.296" : "pdf-parse 2.4.5",
        ...(layout ? { layout: layout.diagnostics } : {}),
      },
      documents: [
        {
          id: "PDF-" + sha256.slice(0, 16),
          title: name,
          version: sha256,
          roles: [],
          rooms: [],
          sections,
        },
      ],
    };
  } finally {
    await parser.destroy();
  }
}
