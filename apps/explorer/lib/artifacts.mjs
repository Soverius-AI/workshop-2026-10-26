import { groupedChunks } from "./grouped-chunks.mjs";
import { createHash } from "node:crypto";
export function chunkCorpus(
  corpus,
  { size = 900, overlap = 100, strategy = "section" } = {},
) {
  if (
    !Number.isInteger(size) ||
    size < 100 ||
    size > 10000 ||
    !Number.isInteger(overlap) ||
    overlap < 0 ||
    overlap >= size
  )
    throw Error(
      "Use a chunk size of 100–10000 characters and overlap smaller than size.",
    );
  if (!["section", "fixed", "paragraph", "structure"].includes(strategy))
    throw Error("Unknown chunking strategy");
  if (["paragraph", "structure"].includes(strategy)) {
    if (overlap !== 0)
      throw Error(
        "Paragraph and structure strategies preserve whole paragraphs; use --overlap 0.",
      );
    return groupedChunks(corpus, { size, overlap, strategy });
  }
  const chunks = [];
  for (const doc of corpus.documents)
    for (const section of doc.sections) {
      const sourceHash = createHash("sha256")
        .update(section.text)
        .digest("hex");
      const text = section.text.trim();
      let start = 0,
        part = 0;
      while (start < text.length) {
        let end = Math.min(start + size, text.length);
        if (strategy === "section" && end < text.length) {
          const boundary = text.lastIndexOf("\n\n", end);
          if (boundary > start + size / 2) end = boundary;
        }
        const body = text.slice(start, end).trim();
        const id = createHash("sha256")
          .update(
            [
              doc.id,
              section.heading,
              section.page ?? "",
              sourceHash,
              strategy,
              size,
              overlap,
              start,
            ].join("|"),
          )
          .digest("hex")
          .slice(0, 20);
        chunks.push({
          id,
          source: doc.id,
          title: doc.title,
          section: section.heading,
          page: section.page ?? null,
          version: doc.version,
          sourceHash,
          roles: doc.roles,
          rooms: doc.rooms ?? [],
          text: body,
          characters: body.length,
          part: ++part,
        });
        if (end === text.length) break;
        start = Math.max(start + 1, end - overlap);
      }
    }
  return {
    schemaVersion: 1,
    kind: "chunks",
    settings: { size, overlap, strategy, unit: "characters" },
    chunks,
  };
}
export function validateArtifact(input, { vectors = false } = {}) {
  const a = Array.isArray(input)
    ? { schemaVersion: 1, kind: "chunks", chunks: input }
    : input;
  if (
    !a ||
    !Array.isArray(a.chunks) ||
    a.chunks.length < 1 ||
    a.chunks.length > 3000
  )
    throw Error("Expected an object with 1–3000 chunks.");
  const ids = new Set();
  let dimensions = 0;
  for (const c of a.chunks) {
    if (
      typeof c.id !== "string" ||
      !c.id ||
      ids.has(c.id) ||
      typeof c.text !== "string" ||
      !c.text.trim() ||
      c.text.length > 30000
    )
      throw Error(
        "Each chunk needs unique id and nonempty text (at most 30000 characters).",
      );
    ids.add(c.id);
    if (vectors || c.vector !== undefined) {
      if (
        !Array.isArray(c.vector) ||
        !c.vector.length ||
        c.vector.length > 4096 ||
        c.vector.some((x) => typeof x !== "number" || !Number.isFinite(x)) ||
        !c.vector.some((x) => x !== 0)
      )
        throw Error(
          "Vectors must contain 1–4096 finite numbers and have nonzero length.",
        );
      dimensions ||= c.vector.length;
      if (c.vector.length !== dimensions)
        throw Error("All vectors must have the same dimensions.");
    }
  }
  if (
    vectors &&
    (typeof a.embedding?.model !== "string" ||
      !a.embedding.model ||
      typeof a.embedding.documentPrefix !== "string")
  )
    throw Error(
      "Embedding artifact must include model and documentPrefix. Use the lab embed script.",
    );
  return { ...a, dimensions };
}
export function cosine(a, b) {
  if (a.length !== b.length) throw Error("Dimension mismatch");
  let dot = 0,
    aa = 0,
    bb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    aa += a[i] ** 2;
    bb += b[i] ** 2;
  }
  return dot / Math.sqrt(aa * bb);
}
export function embeddingConfig() {
  return {
    model: process.env.EMBED_MODEL,
    spaceId: process.env.EMBED_SPACE_ID,
    documentPrefix: process.env.DOCUMENT_PREFIX ?? "",
    queryPrefix: process.env.QUERY_PREFIX ?? "",
  };
}
export function resolveEmbeddingConfig(embedding, config = embeddingConfig()) {
  if (
    !embedding ||
    embedding.model !== config.model ||
    embedding.documentPrefix !== config.documentPrefix
  )
    throw Error(
      "Imported vectors use a different model or document prefix. Re-embed with the current lab settings.",
    );
  // Query formatting and the database space belong to the Explorer, not uploaded JSON.
  return { ...config };
}
export async function modelRequest(base, path, body, key) {
  const res = await fetch(base.replace(/\/$/, "") + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key ?? "local-workshop"}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(90000),
  });
  if (!res.ok)
    throw Error(
      `Model endpoint returned ${res.status}. Check the model server and configuration.`,
    );
  return res.json();
}
export async function embedTexts(texts, purpose = "document") {
  const config = embeddingConfig(),
    prefix = purpose === "query" ? config.queryPrefix : config.documentPrefix;
  const r = await modelRequest(
    process.env.EMBED_BASE_URL,
    "/embeddings",
    { model: config.model, input: texts.map((t) => prefix + t) },
    process.env.EMBED_API_KEY,
  );
  const rows = r.data;
  if (!Array.isArray(rows) || rows.length !== texts.length)
    throw Error("Invalid embedding response");
  const sorted = [...rows].sort((a, b) => a.index - b.index);
  if (sorted.some((x, i) => x.index !== i))
    throw Error("Invalid embedding response indexes");
  const artifact = {
    chunks: sorted.map((x, i) => ({
      id: String(i),
      text: texts[i],
      vector: x.embedding,
    })),
  };
  validateArtifact(artifact);
  if (sorted.some((x) => !Array.isArray(x.embedding)))
    throw Error("Missing embedding");
  return sorted.map((x) => x.embedding);
}
