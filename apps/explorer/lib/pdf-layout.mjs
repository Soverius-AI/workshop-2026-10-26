import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

// PDF text runs are not paragraphs. Keep content-stream reading order, and use
// baseline spacing / column jumps as explicit, inspectable layout heuristics.
export function layoutLines(items) {
  const lines = [];
  let line;
  for (const item of items) {
    if (!item.str?.trim()) continue;
    const x = item.transform[4],
      y = item.transform[5],
      height = Math.abs(item.height) || Math.abs(item.transform[3]) || 10;
    const same =
      line &&
      Math.abs(line.y - y) <= Math.max(3, height * 0.4) &&
      x >= line.endX - 3 &&
      x - line.endX < Math.max(25, height * 3);
    if (same) {
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
export function paragraphsFromLines(lines) {
  const paragraphs = [];
  for (const line of lines) {
    if (!paragraphs.length || line.breakBefore)
      paragraphs.push(line.text.trim());
    else paragraphs[paragraphs.length - 1] += " " + line.text.trim();
  }
  return paragraphs.filter(Boolean);
}
const normalize = (text) =>
  text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");

export async function readLayout(bytes, { structure = false } = {}) {
  const task = getDocument({ data: new Uint8Array(bytes), verbosity: 0 });
  const pdf = await task.promise;
  try {
    const bookmarks = [];
    async function walk(nodes, path = []) {
      for (const node of nodes ?? []) {
        const title = node.title.replace(/\uFFFC/g, "").trim(),
          headingPath = [...path, title];
        let page;
        try {
          const dest =
            typeof node.dest === "string"
              ? await pdf.getDestination(node.dest)
              : node.dest;
          if (dest)
            page = Number.isInteger(dest[0])
              ? dest[0] + 1
              : (await pdf.getPageIndex(dest[0])) + 1;
        } catch {
          /* Report unresolved bookmarks instead of guessing their destinations. */
        }
        bookmarks.push({ title, headingPath, page, matched: false });
        await walk(node.items, headingPath);
      }
    }
    if (structure) await walk(await pdf.getOutline());
    if (structure && !bookmarks.length)
      throw Error(
        "No PDF bookmarks found. Structure chunking requires embedded section bookmarks; use --strategy paragraph for this PDF.",
      );
    const sections = [],
      pages = [];
    let active;
    for (let number = 1; number <= pdf.numPages; number++) {
      const page = await pdf.getPage(number);
      const lines = layoutLines((await page.getTextContent()).items);
      const text = lines.map((l) => l.text).join("\n");
      pages.push({ num: number, text });
      if (!text.trim()) {
        page.cleanup();
        continue;
      }
      if (!structure) {
        const paragraphs = paragraphsFromLines(lines);
        sections.push({
          heading: `PDF page ${number}`,
          page: number,
          text: paragraphs.join("\n\n"),
          paragraphs,
          boundary: "layout-paragraphs",
        });
      } else {
        const candidates = bookmarks.filter((b) => b.page === number);
        let pending = [];
        // A page with new section bookmarks starts unassigned until a heading matches.
        // This also prevents stale/broken bookmarks from inheriting the previous section.
        if (candidates.length) active = undefined;
        const flush = () => {
          if (!pending.length) return;
          const paragraphs = paragraphsFromLines(pending);
          sections.push({
            heading: active?.title ?? `Unsectioned page ${number}`,
            headingPath: active?.headingPath ?? [],
            page: number,
            text: paragraphs.join("\n\n"),
            paragraphs,
            boundary: active ? "pdf-bookmark" : "unsectioned",
            includeHeading: !!active,
          });
          pending = [];
        };
        for (let i = 0; i < lines.length; i++) {
          let found, length;
          for (let n = 1; n <= 3 && i + n <= lines.length; n++) {
            found = candidates.find(
              (b) =>
                !b.matched &&
                normalize(b.title) ===
                  normalize(
                    lines
                      .slice(i, i + n)
                      .map((l) => l.text)
                      .join(" "),
                  ),
            );
            if (found) {
              length = n;
              break;
            }
          }
          if (found) {
            flush();
            active = found;
            found.matched = true;
            i += length - 1;
          } else pending.push(lines[i]);
        }
        flush();
      }
      page.cleanup();
    }
    if (structure && !bookmarks.some((b) => b.matched))
      throw Error(
        "PDF bookmarks could not be matched to page headings. Use --strategy paragraph; no structural boundaries were guessed.",
      );
    return {
      sections,
      pages,
      diagnostics: {
        method: structure
          ? "pdf-bookmarks + layout-paragraphs"
          : "layout-paragraphs",
        paragraphDetection:
          "Layout heuristic; paragraph tags and table cells are not reconstructed.",
        bookmarks: bookmarks.length,
        matchedBookmarks: bookmarks.filter((b) => b.matched).length,
        unmatchedBookmarks: bookmarks
          .filter((b) => !b.matched)
          .map((b) => ({ title: b.title, page: b.page ?? null })),
      },
    };
  } finally {
    await pdf.destroy();
  }
}
