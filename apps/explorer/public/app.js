import { UMAP } from "umap-js";
const root = document.querySelector("#app");
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let me,
  tab = "chunks",
  artifact,
  comparison,
  filename = "",
  selected = 0,
  projection,
  queryPoint,
  searchResult;
const palette = [
  "#31599a",
  "#178b90",
  "#8265ae",
  "#c27837",
  "#577a42",
  "#b05272",
  "#476d82",
  "#8d7450",
];
const $ = (s) => document.querySelector(s);
async function api(path, data) {
  const r = await fetch("/api/" + path, {
    method: data === undefined ? "GET" : "POST",
    headers: data === undefined ? {} : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const b = await r.json();
  if (!r.ok) throw Error(b.error ?? `Request failed (${r.status})`);
  return b;
}
function report(message, good = false) {
  $("#feedback").innerHTML =
    `<div class="${good ? "success" : "error"}" role="status">${esc(message)}</div>`;
}
function bind(selector, event, fn) {
  const el = $(selector);
  if (el)
    el.addEventListener(event, async (e) => {
      try {
        await fn(e);
      } catch (error) {
        report(error.message);
      }
    });
}
function buttonBusy(el, busy) {
  el.disabled = busy;
}
async function task(el, fn) {
  buttonBusy(el, true);
  try {
    await fn();
  } catch (e) {
    report(e.message);
  } finally {
    buttonBusy(el, false);
  }
}
function download(name, data) {
  const a = document.createElement("a");
  const u = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
function login(error = "") {
  root.innerHTML = `<div class="login"><section class="login-story"><p class="screen-label">THE AI ENGINEERING WORKSHOP</p><h1>Look inside<br>your RAG pipeline.</h1><p>Run the code. Explore the chunks. Find the evidence.</p><p class="help">A hands-on lab for the chocolate factory.</p></section><section class="login-form"><img src="/logo.png" alt="Soverius AI"><h2>Welcome to the lab</h2><p class="intro">Sign in with your workshop account.</p><nav class="exercise-links" aria-label="Participant exercises"><a href="https://ai-engineering.localhost/labs/02-context-engineering.html" target="_blank" rel="noopener">Unit 2 instructions ↗</a><a href="https://ai-engineering.localhost/labs/" target="_blank" rel="noopener">All exercises ↗</a></nav><div id="feedback">${error ? `<div class="error">${esc(error)}</div>` : ""}</div><form id="login"><label>Username<input name="username" autocomplete="username" value="operator" required></label><label>Password<input name="password" type="password" autocomplete="current-password" required></label><button class="primary">Sign in</button></form><div class="login-note">Training accounts: <b>operator</b> and <b>maintenance</b><br>Default workshop password: <b>workshop</b><br>All company records are fictional.</div></section></div>`;
  bind("#login", "submit", async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    await api("login", Object.fromEntries(f));
    await start();
  });
}
const names = {
  chunks: "Chunks",
  embeddings: "Embeddings",
  database: "PostgreSQL",
  retrieval: "Retrieval",
  reranking: "Reranking",
  grounding: "Grounding",
  relationships: "Relationships",
  security: "Security",
};
function render() {
  window.scrollTo({ top: 0 });
  root.innerHTML = `<div class="shell"><aside class="sidebar"><img class="logo" src="/logo.png" alt="Soverius AI"><div class="nav-label">CORE EXERCISES</div><nav class="nav" aria-label="Core exercises">${Object.entries(
    names,
  )
    .slice(0, 4)
    .map(
      ([k, n], i) =>
        `<button data-tab="${k}" class="${tab === k ? "active" : ""}" ${tab === k ? 'aria-current="page"' : ""}><span class="num">0${i + 1}</span>${n}</button>`,
    )
    .join(
      "",
    )}</nav><div class="nav-label">BONUS EXERCISES</div><nav class="nav" aria-label="Bonus exercises">${Object.entries(
    names,
  )
    .slice(4)
    .map(
      ([k, n]) =>
        `<button data-tab="${k}" class="${tab === k ? "active" : ""}"><span class="num">＋</span>${n}</button>`,
    )
    .join(
      "",
    )}</nav><footer>RAG Lab Explorer<br><div class="account"><b>${esc(me.role)}</b><button id="logout" class="small">Sign out</button></div><p>Local models · PostgreSQL<br>Fictional factory data</p></footer></aside><main class="main"><div class="topbar"><span>WORKSHOP / CONTEXT ENGINEERING</span><nav class="exercise-links" aria-label="Participant exercises"><a href="https://ai-engineering.localhost/labs/02-context-engineering.html" target="_blank" rel="noopener">Unit 2 instructions ↗</a><a href="https://ai-engineering.localhost/labs/" target="_blank" rel="noopener">All exercises ↗</a></nav><span class="status"><i class="dot"></i>PostgreSQL connected</span></div><div id="feedback" aria-live="polite"></div><div id="view"></div></main></div>`;
  document.querySelectorAll("[data-tab]").forEach(
    (b) =>
      (b.onclick = () => {
        tab = b.dataset.tab;
        render();
      }),
  );
  bind("#logout", "click", async () => {
    await api("logout", {});
    artifact = null;
    comparison = null;
    projection = null;
    searchResult = null;
    login();
  });
  ({
    chunks: chunksView,
    embeddings: embeddingsView,
    database: databaseView,
    retrieval: retrievalView,
    reranking: () => modelView("reranking"),
    grounding: () => modelView("grounding"),
    relationships: relationshipsView,
    security: securityView,
  })[tab]();
}
function heading(step, title, description) {
  return `<p class="screen-label">${step}</p><h1>${title}</h1><p class="intro">${description}</p>`;
}
function parseArtifact(text) {
  const v = JSON.parse(text),
    a = Array.isArray(v)
      ? { chunks: v }
      : v?.text !== undefined
        ? { chunks: [v] }
        : v;
  if (!a?.chunks?.length || a.chunks.length > 3000)
    throw Error("Upload JSON with 1–3000 chunks.");
  const ids = new Set();
  let dims;
  for (const c of a.chunks) {
    if (
      typeof c.text !== "string" ||
      !c.text.trim() ||
      typeof c.id !== "string" ||
      ids.has(c.id)
    )
      throw Error("Chunks need text and unique string IDs.");
    ids.add(c.id);
    if (c.vector !== undefined) {
      if (
        !Array.isArray(c.vector) ||
        !c.vector.length ||
        c.vector.length > 4096 ||
        c.vector.some((x) => typeof x !== "number" || !Number.isFinite(x)) ||
        !c.vector.some((x) => x !== 0)
      )
        throw Error("Invalid embedding vector");
      dims ??= c.vector.length;
      if (dims !== c.vector.length)
        throw Error("Embedding dimensions do not match");
    }
  }
  return a;
}
async function loadFile(file, compare = false) {
  if (!file) return;
  if (file.size > 32 * 1024 * 1024) throw Error("Maximum file size is 32 MB.");
  const a = parseArtifact(await file.text());
  if (compare) comparison = a;
  else {
    artifact = a;
    comparison = null;
    filename = file.name;
    selected = 0;
    projection = null;
    queryPoint = null;
  }
  render();
}
function uploadPanel() {
  return `<div class="drop"><b>Open your exercise output</b><p class="help">Drop a JSON file here, choose a file, or paste below.</p><input id="upload" type="file" accept=".json,application/json" aria-label="Upload exercise JSON"></div><details><summary>Paste JSON</summary><textarea id="paste" aria-label="Paste artifact JSON"></textarea><button id="open-paste">Open JSON</button></details><p class="file-name">${artifact ? esc(filename) + " · " + artifact.chunks.length + " chunks" : "No artifact loaded"}</p>`;
}
function bindUpload() {
  bind("#upload", "change", (e) => loadFile(e.target.files[0]));
  bind("#open-paste", "click", () => {
    artifact = parseArtifact($("#paste").value);
    comparison = null;
    filename = "Pasted JSON";
    selected = 0;
    projection = null;
    queryPoint = null;
    render();
  });
  const d = $(".drop");
  if (d) {
    d.ondragover = (e) => {
      e.preventDefault();
    };
    d.ondrop = (e) => {
      e.preventDefault();
      loadFile(e.dataTransfer.files[0]).catch((e) => report(e.message));
    };
  }
}
function chunkCard(c, i, interactive = true) {
  return `<article class="chunk ${i === selected ? "selected" : ""}"><header><h3>${esc(c.title ?? c.source ?? "Document")}</h3>${interactive ? `<button data-chunk="${i}">Inspect</button>` : ""}</header><div><span class="tag">${esc(c.section ?? "Section")}</span>${c.page ? `<span class="tag">PDF p. ${esc(c.page)}</span>` : ""}<span class="tag">${c.text.length} characters</span></div><p>${esc(c.text)}</p></article>`;
}
function chunkChoice(c, i) {
  return `<button class="chunk-choice ${i === selected ? "selected" : ""}" data-chunk="${i}" aria-pressed="${i === selected}"><b>Chunk ${i + 1}</b><span>${esc(c.section ?? c.title ?? c.source ?? c.id)}${c.page ? " · p. " + esc(c.page) : ""}</span><small>${c.text.length} characters</small></button>`;
}
function chunkDetails() {
  const c = artifact.chunks[selected];
  const metadata = { ...c, text: undefined, vector: undefined };
  $("#chunk-detail").innerHTML =
    `<h2>Chunk ${selected + 1} of ${artifact.chunks.length}</h2><div>${c.fileName || c.title ? `<span class="tag">${esc(c.fileName ?? c.title)}</span>` : ""}${c.page ? `<span class="tag">PDF page ${esc(c.page)}</span>` : ""}<span class="tag">${c.text.length} characters</span></div><h3>Text</h3><p class="chunk-text">${esc(c.text)}</p><h3>Metadata</h3><dl class="chunk-fields">${Object.entries(
      metadata,
    )
      .filter(([, v]) => v !== undefined)
      .map(
        ([k, v]) =>
          `<dt>${esc(k)}</dt><dd>${esc(typeof v === "object" ? JSON.stringify(v) : v)}</dd>`,
      )
      .join(
        "",
      )}</dl>${c.vector ? `<details><summary>Embedding vector · ${c.vector.length} dimensions</summary><pre>${esc(JSON.stringify(c.vector))}</pre></details>` : ""}`;
}
function chunksView() {
  $("#view").innerHTML =
    heading(
      "01 / PREPARE",
      "Explore your chunks",
      "Upload a JSON file or paste JSON, then select a chunk to inspect its text and metadata.",
    ) +
    `<section class="panel"><div class="grid"><div class="drop"><h2>Upload JSON</h2><p class="help">Choose a file or drop it here.</p><input id="upload" type="file" accept=".json,application/json" aria-label="Upload exercise JSON"></div><div><label>Paste JSON<textarea id="paste" aria-label="Paste artifact JSON" placeholder="Paste your chunk JSON here" spellcheck="false"></textarea></label><button id="open-paste" class="primary">Open JSON</button></div></div>${artifact ? `<p class="file-name">${esc(filename)} · ${artifact.chunks.length} chunks</p>` : ""}</section>${artifact ? `<div class="chunk-workspace"><section class="panel"><h2>Your chunks</h2><label>Filter chunks<input id="filter" placeholder="Search text or metadata"></label><div id="chunks" class="chunk-list">${artifact.chunks.map(chunkChoice).join("")}</div></section><section class="panel" id="chunk-detail" aria-label="Selected chunk"></section></div><details class="panel chunk-comparison"><summary>Compare another run</summary><label>Second JSON artifact<input id="compare" type="file" accept=".json,application/json"></label>${comparison ? `<p>${comparison.chunks.length} chunks in the comparison</p><div class="chunk-list">${comparison.chunks.map((c, i) => chunkCard(c, i, false)).join("")}</div>` : ""}</details>` : '<div class="empty">Your chunks will appear here after you open JSON.</div>'}`;
  bindUpload();
  bind("#compare", "change", (e) => loadFile(e.target.files[0], true));
  bind("#filter", "input", (e) => {
    const q = e.target.value.toLowerCase();
    const matches = artifact.chunks
      .map((c, i) => ({ c, i }))
      .filter(({ c }) =>
        JSON.stringify({ ...c, vector: undefined })
          .toLowerCase()
          .includes(q),
      );
    $("#chunks").innerHTML = matches.length
      ? matches.map(({ c, i }) => chunkChoice(c, i)).join("")
      : '<p class="help">No matching chunks.</p>';
    bindChunks();
  });
  if (artifact) {
    chunkDetails();
    bindChunks();
  }
}
function bindChunks() {
  document.querySelectorAll("[data-chunk]").forEach(
    (b) =>
      (b.onclick = () => {
        selected = Number(b.dataset.chunk);
        chunkDetails();
        document.querySelectorAll("[data-chunk]").forEach((button) => {
          const active = Number(button.dataset.chunk) === selected;
          button.classList.toggle("selected", active);
          button.setAttribute("aria-pressed", String(active));
        });
      }),
  );
}
function cosine(a, b) {
  let d = 0,
    aa = 0,
    bb = 0;
  for (let i = 0; i < a.length; i++) {
    d += a[i] * b[i];
    aa += a[i] * a[i];
    bb += b[i] * b[i];
  }
  return d / Math.sqrt(aa * bb);
}
function embeddingReady() {
  return artifact?.chunks?.every((c) => Array.isArray(c.vector));
}
function embeddingsView() {
  const ready = embeddingReady();
  $("#view").innerHTML =
    heading(
      "02 / REPRESENT",
      "Explore the embedding space",
      "Each point is a chunk. Select one to read its text and find its nearest neighbours in the original vector space.",
    ) +
    `<div class="grid wide"><section class="panel"><h2>Your embeddings</h2>${uploadPanel()}<div class="command">node workshop/exercises/embed.mts workshop/output/optyma-chunks.json workshop/output/embeddings.json</div><div class="toolbar"><button id="project" class="primary" ${ready ? "" : "disabled"}>Build 2D map</button><span class="help">${ready ? artifact.chunks[0].vector.length + " dimensions · " + artifact.chunks.length + " vectors" : "Load embeddings.json to begin"}</span></div><p class="help">UMAP projection · cosine distance · fixed seed. The plot is approximate; similarity scores use all original dimensions. Up to 800 points are plotted.</p><svg id="plot" class="plot" viewBox="0 0 650 430" role="img" aria-label="Two-dimensional embedding projection"></svg><div id="legend" class="legend"></div><hr><label>Find passages for a question<input id="vector-question" value="The cooling room is too warm. What should I do?"></label><div class="toolbar"><button id="embed-question" ${ready ? "" : "disabled"}>Embed question and compare</button></div><p class="help">Calls your local embedding server. Imported vectors must use the same model and configuration.</p></section><section class="panel"><h2>Selected passage & neighbours</h2><div id="neighbours" class="empty">Click a point in the map.</div></section></div>`;
  bindUpload();
  bind("#project", "click", (e) =>
    task(e.target, async () => {
      const sourceArtifact = artifact;
      const vectors = artifact.chunks.slice(0, 800).map((c) => c.vector);
      if (vectors.length < 4)
        throw Error("Use at least four vectors for this projection.");
      report("Calculating UMAP projection…", true);
      let seed = 42;
      const random = () =>
        (seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296;
      const umap = new UMAP({
        nComponents: 2,
        nNeighbors: Math.min(12, vectors.length - 1),
        nEpochs: 200,
        minDist: 0.15,
        random,
        distanceFn: (a, b) => Math.max(0, 1 - cosine(a, b)),
      });
      const points = await umap.fitAsync(vectors);
      if (artifact !== sourceArtifact) return;
      projection = { points, umap };
      if (tab !== "embeddings") return;
      drawPlot();
      showNeighbours(selected);
      report(
        "Projection ready. Select a point to inspect real cosine similarities.",
        true,
      );
    }),
  );
  bind("#embed-question", "click", (e) =>
    task(e.target, async () => {
      const config = artifact.embedding;
      if (
        !config ||
        config.model !== me.embedding.model ||
        config.documentPrefix !== me.embedding.documentPrefix
      )
        throw Error(
          "This artifact uses a different embedding configuration. Re-embed with the current lab settings.",
        );
      const r = await api("embed-query", {
        question: $("#vector-question").value,
      });
      if (r.vector.length !== artifact.chunks[0].vector.length)
        throw Error("Dimension mismatch");
      showNeighbours(-1, r.vector, $("#vector-question").value);
      if (projection) {
        queryPoint = projection.umap.transform([r.vector])[0];
        drawPlot();
      }
    }),
  );
  if (projection) drawPlot();
}
function drawPlot() {
  const pts = projection.points;
  const all = queryPoint ? [...pts, queryPoint] : pts;
  const xs = all.map((p) => p[0]),
    ys = all.map((p) => p[1]);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const xy = (p) => [
    35 + ((p[0] - minX) / (maxX - minX || 1)) * 580,
    30 + ((p[1] - minY) / (maxY - minY || 1)) * 365,
  ];
  const sources = [...new Set(artifact.chunks.map((c) => c.source))];
  $("#plot").innerHTML =
    pts
      .map((p, i) => {
        const [x, y] = xy(p);
        return `<circle cx="${x}" cy="${y}" r="7" fill="${palette[sources.indexOf(artifact.chunks[i].source) % palette.length]}" data-point="${i}" tabindex="0" role="button" aria-label="Chunk ${esc(artifact.chunks[i].section ?? artifact.chunks[i].id)}"><title>${esc(artifact.chunks[i].title)} — ${esc(artifact.chunks[i].section)}</title></circle>`;
      })
      .join("") +
    (queryPoint
      ? (() => {
          const [x, y] = xy(queryPoint);
          return `<path d="M ${x} ${y - 10} L ${x + 10} ${y} L ${x} ${y + 10} L ${x - 10} ${y} Z" fill="#162944"/><text x="${x + 13}" y="${y + 4}" font-size="12">Question</text>`;
        })()
      : "");
  $("#legend").innerHTML = sources
    .map(
      (s, i) =>
        `<span><i style="background:${palette[i % palette.length]}"></i>${esc(s)}</span>`,
    )
    .join("");
  document.querySelectorAll("[data-point]").forEach((c) => {
    c.onclick = () => {
      selected = Number(c.dataset.point);
      showNeighbours(selected);
    };
    c.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        c.onclick();
      }
    };
  });
}
function showNeighbours(i, vector, label) {
  const v = vector ?? artifact.chunks[i].vector;
  const near = artifact.chunks
    .map((c, j) => ({ c, j, score: cosine(v, c.vector) }))
    .filter((x) => x.j !== i)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  $("#neighbours").className = "";
  $("#neighbours").innerHTML =
    (i >= 0
      ? chunkCard(artifact.chunks[i], i, false)
      : `<h3>${esc(label)}</h3>`) +
    `<h3>Nearest neighbours · original dimensions</h3>` +
    near
      .map(
        ({ c, score }) =>
          `<article class="chunk"><span class="tag blue">Cosine similarity ${score.toFixed(4)}</span><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p></article>`,
      )
      .join("");
}
const sqlExamples = {
  inspect:
    "SELECT id, title, section, page, vector_dims(embedding) AS dimensions, left(embedding::text, 100) AS vector_preview FROM practice.chunks LIMIT 20;",
  insert:
    "INSERT INTO practice.chunks(id, source, title, content, metadata) VALUES ('my-example', 'my-notes', 'Workshop note', 'Keep the cooling room door closed.', '{\"exercise\":true}') RETURNING id, content;",
  select:
    "SELECT id, title, content FROM practice.chunks WHERE content ILIKE '%cooling%' LIMIT 20;",
  similarity: "",
};
const sqlLiteral = (value) => "'" + String(value).replaceAll("'", "''") + "'";
function comparisonSql(id) {
  return `WITH reference_chunk AS (
  SELECT id, embedding, space_id
  FROM practice.chunks
  WHERE id = ${sqlLiteral(id)} AND embedding IS NOT NULL
)
SELECT c.id, c.title, c.content,
       c.embedding <=> r.embedding AS cosine_distance,
       1 - (c.embedding <=> r.embedding) AS similarity
FROM practice.chunks c
CROSS JOIN reference_chunk r
WHERE c.embedding IS NOT NULL
  AND c.space_id = r.space_id
  AND c.id <> r.id
ORDER BY c.embedding <=> r.embedding, c.id
LIMIT 5;`;
}
function table(r) {
  return `<p class="help">${r.rowCount ?? r.rows.length} rows${r.truncated ? " · first 200 displayed" : ""}</p><div class="table-wrap"><table><thead><tr>${r.columns.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${r.rows.map((row) => `<tr>${r.columns.map((c) => `<td>${esc(typeof row[c] === "object" ? JSON.stringify(row[c]) : row[c])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
function databaseView() {
  $("#view").innerHTML =
    heading(
      "03 / STORE",
      "Inside PostgreSQL",
      "Store your vectors, inspect the rows and execute SQL yourself. The console connects to the practice schema with its own restricted database role.",
    ) +
    `<div class="grid"><section class="panel"><h2>Import your embeddings</h2>${uploadPanel()}<button id="store" class="primary" ${embeddingReady() ? "" : "disabled"}>Replace practice corpus with this artifact</button><p class="help">Replaces only this lab’s practice corpus, in one transaction. Never modifies the incident application or protected demo documents.</p></section><section class="panel"><h2>What is stored?</h2><p>Text, source references and metadata stay beside the vector. No information is hidden behind an AI framework.</p><p class="help">Table: practice.chunks<br>Embedding type: pgvector vector<br>Search: exact cosine distance<br>Connection role: lab_writer</p><div class="notice">Document permissions in uploaded JSON are inspectable metadata. Protected retrieval uses a separate trusted catalogue and database roles.</div></section></div><section class="panel" style="margin-top:20px"><h2>Choose a reference chunk</h2><div class="toolbar"><label class="grow">Filter stored chunks<input id="reference-filter" placeholder="Find an ID or passage text"></label><button id="load-references" class="small">Load chunks</button></div><label>Reference chunk<select id="reference-chunk" aria-label="Reference chunk" disabled><option value="">Loading stored chunks…</option></select></label><p id="reference-count" class="help"></p><div id="reference-preview" class="help">Choose a stored chunk to read its text.</div><p class="help">Compare its closest neighbours below. The reference itself is excluded. In 02.5, you will use a question’s embedding instead.</p></section><section class="panel" style="margin-top:20px"><h2>SQL console</h2><div class="toolbar">${Object.keys(
      sqlExamples,
    )
      .map(
        (k) =>
          `<button data-sql="${k}" class="small" ${k === "similarity" ? "disabled" : ""}>${{ inspect: "Inspect vectors", insert: "Insert a row", select: "Select passages", similarity: "Compare stored vectors" }[k]}</button>`,
      )
      .join(
        "",
      )}</div><label>SQL statement<textarea id="sql" spellcheck="false">${esc(sqlExamples.inspect)}</textarea></label><div class="toolbar"><button id="execute" class="primary">Execute SQL</button><span class="help">One statement · 5-second database timeout · 200 displayed rows</span></div><div id="sql-result"></div></section>`;
  const picker = $("#reference-chunk"),
    preview = $("#reference-preview"),
    compare = $('[data-sql="similarity"]');
  let referenceChunks = [];
  async function loadReferences() {
    $("#sql").value = sqlExamples.inspect;
    picker.disabled = true;
    compare.disabled = true;
    picker.innerHTML = '<option value="">Loading stored chunks…</option>';
    preview.textContent = "Choose a stored chunk to read its text.";
    $("#sql-result").innerHTML = "";
    const term = $("#reference-filter").value.trim();
    const filter = term
      ? ` AND (id ILIKE ${sqlLiteral("%" + term + "%")} OR content ILIKE ${sqlLiteral("%" + term + "%")})`
      : "";
    const r = await api("sql", {
      sql: `SELECT id, title, content FROM practice.chunks WHERE embedding IS NOT NULL${filter} ORDER BY id`,
    });
    if (!picker.isConnected) return;
    referenceChunks = r.rows;
    picker.innerHTML =
      '<option value="">Choose a reference chunk</option>' +
      referenceChunks
        .map(
          (c) =>
            `<option value="${esc(c.id)}">${esc(c.id)} — ${esc(c.content.slice(0, 100))}</option>`,
        )
        .join("");
    picker.disabled = !referenceChunks.length;
    $("#reference-count").textContent = r.truncated
      ? `Showing 200 of ${r.rowCount} matching chunks. Filter to find another passage.`
      : referenceChunks.length
        ? `${referenceChunks.length} stored ${referenceChunks.length === 1 ? "chunk" : "chunks"} with embeddings.`
        : "No matching embedded chunks. Import your embeddings or change the filter.";
  }
  bindUpload();
  bind("#load-references", "click", (e) => task(e.target, loadReferences));
  bind("#reference-filter", "keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      return task($("#load-references"), loadReferences);
    }
  });
  bind("#reference-chunk", "change", () => {
    const c = referenceChunks.find((c) => c.id === picker.value);
    compare.disabled = !c;
    $("#sql-result").innerHTML = "";
    preview.innerHTML = c
      ? `<article class="chunk"><h3>${esc(c.id)} · ${esc(c.title)}</h3><p>${esc(c.content)}</p></article>`
      : "Choose a stored chunk to read its text.";
    $("#sql").value = c ? comparisonSql(c.id) : sqlExamples.inspect;
  });
  bind("#store", "click", (e) =>
    task(e.target, async () => {
      const r = await api("import", artifact);
      searchResult = null;
      report(
        `Stored ${r.count} chunks with ${r.dimensions}-dimensional embeddings.`,
        true,
      );
      await loadReferences();
    }),
  );
  document.querySelectorAll("[data-sql]").forEach(
    (b) =>
      (b.onclick = () => {
        $("#sql").value =
          b.dataset.sql === "similarity"
            ? comparisonSql(picker.value)
            : sqlExamples[b.dataset.sql];
      }),
  );
  bind("#execute", "click", (e) =>
    task(e.target, async () => {
      $("#sql-result").innerHTML = table(
        await api("sql", { sql: $("#sql").value }),
      );
    }),
  );
  loadReferences().catch((error) => report(error.message));
}
function searchForm() {
  return `<div class="toolbar"><label class="grow">Question<input id="question" value="The cooling room is too warm. What should I do?"></label><label>Corpus<select id="scope"><option value="practice">Practice · imported vectors</option><option value="protected">Protected · current account</option></select></label><label>Search<select id="mode"><option value="vector">Vector similarity</option><option value="keyword">Keyword · PostgreSQL full-text</option></select></label></div><p class="help">The protected demonstration uses keyword search. Try “cooling”, “service” or “maintenance”. PostgreSQL full-text ranking here is not BM25.</p>`;
}
const searchBody = () => ({
  question: $("#question").value,
  scope: $("#scope").value,
  mode: $("#mode").value,
});
function bindSearchForm() {
  bind("#scope", "change", () => {
    if ($("#scope").value === "protected") $("#mode").value = "keyword";
  });
}
function hitsHTML(hits) {
  return hits.length
    ? hits
        .map(
          (c, i) =>
            `<article class="chunk"><span class="tag blue">#${i + 1}${c.before ? " · previously #" + c.before : ""}</span><span class="tag">${c.depth !== undefined ? "Graph distance " + c.depth + " hops" : c.rerankScore !== undefined ? "Reranker " + Number(c.rerankScore).toFixed(4) : "Score " + Number(c.score ?? 0).toFixed(4)}</span><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p><details><summary>Source details</summary><pre>${esc(JSON.stringify({ ...c, text: undefined }, null, 2))}</pre></details></article>`,
        )
        .join("")
    : '<div class="empty">No matching passages. Inspect the stored chunks or try another question.</div>';
}
function retrievalView() {
  $("#view").innerHTML =
    heading(
      "04 / RETRIEVE",
      "Find the relevant passages",
      "Embed your question and find the closest passages in your imported chunks.",
    ) +
    `<section class="panel"><label>Question<input id="question" value="The cooling room is too warm. What should I do?"></label><div class="toolbar"><button id="search" class="primary">Retrieve passages</button></div><p class="help">Searches only the embeddings imported in PostgreSQL, using vector similarity. Compare fixed-size and paragraph chunks by importing each file there and repeating the same question.</p></section><div class="grid wide" style="margin-top:20px"><section class="panel"><h2>Retrieved evidence</h2><div id="hits">${searchResult ? hitsHTML(searchResult.hits) : '<div class="empty">Run a question against your imported chunks.</div>'}</div></section><section class="panel"><h2>The query behind the result</h2><pre id="query-sql">${searchResult ? esc(searchResult.sql) : "Your retrieval SQL appears here."}</pre><p class="help">$1 is the question’s embedding and $2 is its embedding-space ID. The same embedding model must be used for documents and questions, with their respective document and query prefixes.</p></section></div>`;
  bind("#search", "click", (e) =>
    task(e.target, async () => {
      searchResult = await api("search", {
        question: $("#question").value,
        scope: "practice",
        mode: "vector",
      });
      $("#hits").innerHTML = hitsHTML(searchResult.hits);
      $("#query-sql").textContent = searchResult.sql;
    }),
  );
}
function modelView(kind) {
  const ground = kind === "grounding";
  $("#view").innerHTML =
    heading(
      "BONUS / " + (ground ? "GROUND" : "RERANK"),
      ground ? "Build an answer from evidence" : "Compare the ranking",
      ground
        ? "Inspect exactly what the model receives, then verify each claim against its cited passage."
        : "A reranker reads question–passage pairs and reorders the existing candidates. It cannot recover a missing passage.",
    ) +
    `<section class="panel">${searchForm()}${ground ? '<label class="check"><input id="ground-rerank" type="checkbox">Rerank evidence before generating (requires the reranking model)</label><label class="check"><input id="injection" type="checkbox">Add a clearly marked prompt-injection test to the supplied evidence</label>' : ""}<div class="toolbar"><button id="model-run" class="primary">${ground ? "Generate grounded answer" : "Rerank candidates"}</button></div><p class="help">Requires the configured local ${ground ? "chat" : "reranking"} model. No synthetic scores or answers are substituted.</p></section><div class="grid wide" style="margin-top:20px"><section class="panel"><h2>${ground ? "Answer" : "Reranked passages"}</h2><div id="model-result" class="help">Ready when your local model is running.</div></section><section class="panel"><h2>${ground ? "Context sent to the model" : "Original candidates"}</h2><div id="model-context"></div></section></div>`;
  bindSearchForm();
  bind("#model-run", "click", (e) =>
    task(e.target, async () => {
      const b = searchBody();
      if (ground) {
        const r = await api("ground", {
          ...b,
          injection: $("#injection").checked,
          rerank: $("#ground-rerank").checked,
        });
        $("#model-result").textContent = r.answer;
        $("#model-context").innerHTML =
          `<pre>${esc(JSON.stringify(r.messages, null, 2))}</pre>` +
          hitsHTML(r.hits);
      } else {
        const before = await api("search", b);
        const after = await api("rerank", b);
        $("#model-result").innerHTML = hitsHTML(after.hits);
        $("#model-context").innerHTML = hitsHTML(before.hits);
      }
    }),
  );
}
async function relationshipsView() {
  $("#view").innerHTML =
    heading(
      "BONUS / EXPAND",
      "Follow document relationships",
      "Traverse explicit links from a procedure to its equipment register, manuals and contacts. Permissions apply to both ends of each link.",
    ) +
    '<section class="panel" id="graph"><p>Loading permitted relationships…</p></section>';
  try {
    const r = await api("relationships"),
      label = (id) => r.documents.find((d) => d.id === id)?.title ?? id;
    $("#graph").innerHTML =
      `<label>Starting document<select id="graph-seed">${r.documents.map((d) => `<option value="${esc(d.id)}">${esc(d.title)}</option>`).join("")}</select></label><div class="toolbar"><button id="expand" class="primary">Expand up to two hops</button><span class="help">Signed in as ${esc(r.role)}</span></div>${r.links.map((l) => `<div class="graph-row"><div class="graph-node">${esc(label(l.source))}</div><div class="graph-rel">${esc(l.relation)} →</div><div class="graph-node">${esc(label(l.target))}</div></div>`).join("")}<div id="expanded"></div>`;
    bind("#expand", "click", (e) =>
      task(e.target, async () => {
        const result = await api("expand", { source: $("#graph-seed").value });
        $("#expanded").innerHTML =
          "<hr><h2>Passages reached</h2>" + hitsHTML(result.hits);
      }),
    );
  } catch (e) {
    report(e.message);
  }
}
async function securityView() {
  $("#view").innerHTML =
    heading(
      "BONUS / VERIFY",
      "Who can see the evidence?",
      "Use the same query under the operator and maintenance accounts. PostgreSQL enforces document access before passages leave the backend.",
    ) + '<div id="security"></div>';
  try {
    const r = await api("security");
    $("#security").innerHTML =
      `<div class="grid"><section class="panel"><h2>Current identity</h2><div class="stats"><div class="stat"><strong>${esc(r.role)}</strong><span>Session identity</span></div></div><p>Database role: <code>${esc(r.databaseRole)}</code></p><p class="help">The backend selects this role from your login. It does not accept a role supplied by the question or uploaded JSON.</p><button id="switch-user">Sign out and compare accounts</button><div class="notice">The SQL playground uses lab_writer, which cannot read protected tables. Try SELECT * FROM protected.chunks in the SQL console.</div></section><section class="panel"><h2>Documents you may access</h2>${r.documents.map((d) => `<div class="source-card"><b>${esc(d.title)}</b><span class="help">${esc(d.id)}</span></div>`).join("")}</section></div><section class="panel" style="margin-top:20px"><h2>Permission check</h2><label>Keyword query<input id="secure-query" value="service"></label><div class="toolbar"><button id="secure-search" class="primary">Search as ${esc(r.role)}</button></div><div id="secure-hits"></div><p class="help">This demonstration uses fictional records. Participants control their own containers; it does not hide distributed files from the laptop owner. The protected demo uses real database policies, not a display filter.</p></section>`;
    bind("#switch-user", "click", async () => {
      await api("logout", {});
      artifact = null;
      projection = null;
      searchResult = null;
      login();
    });
    bind("#secure-search", "click", (e) =>
      task(e.target, async () => {
        const result = await api("search", {
          scope: "protected",
          mode: "keyword",
          question: $("#secure-query").value,
        });
        $("#secure-hits").innerHTML = hitsHTML(result.hits);
      }),
    );
  } catch (e) {
    report(e.message);
  }
}
async function start() {
  try {
    me = await api("me");
    render();
  } catch {
    login();
  }
}
start();
