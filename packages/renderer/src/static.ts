import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import YAML from "yaml";
import {
  contextPackManifestSchema,
  exportProfileSchema,
  recordFrontmatterSchema,
  sourceMapSchema,
  type ContextPackManifest,
  type ExportProfile,
  type RecordFrontmatter,
  type Source
} from "@contextarr/schema";
import { formatValidationResult, validatePack, type ValidationResult } from "@contextarr/pack-validator";
import { renderMarkdownToHtml } from "./markdown";

export interface RenderPackToStaticHtmlOptions {
  packPath: string;
  outputDir: string;
}

export interface RenderPacksToStaticHtmlOptions {
  packsDir: string;
  outputDir: string;
}

export interface StaticRenderResult {
  outputDir: string;
  entryFile: string;
  packsRendered: number;
  recordsRendered: number;
  packIds: string[];
}

export class StaticRenderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StaticRenderError";
  }
}

interface StaticRecord {
  file: string;
  metadata: RecordFrontmatter;
  body: string;
}

interface StaticPack {
  packPath: string;
  manifest: ContextPackManifest;
  validation: ValidationResult;
  records: StaticRecord[];
  sources: Source[];
  exportProfiles: ExportProfile[];
  changelogMarkdown: string | null;
}

export function renderPackToStaticHtml(options: RenderPackToStaticHtmlOptions): StaticRenderResult {
  const pack = loadValidPack(options.packPath);
  const outputDir = path.resolve(options.outputDir);
  ensureDir(outputDir);
  writeStaticAssets(outputDir);
  renderPackIntoDirectory(pack, outputDir, ".");

  return {
    outputDir,
    entryFile: path.join(outputDir, "index.html"),
    packsRendered: 1,
    recordsRendered: pack.records.length,
    packIds: [pack.manifest.id]
  };
}

export function renderPacksToStaticHtml(options: RenderPacksToStaticHtmlOptions): StaticRenderResult {
  const packsDir = path.resolve(options.packsDir);
  if (!fs.existsSync(packsDir) || !fs.statSync(packsDir).isDirectory()) {
    throw new StaticRenderError(`Packs directory is not readable: ${packsDir}`);
  }

  const packs = fs
    .readdirSync(packsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(packsDir, entry.name))
    .filter((candidate) => fs.existsSync(path.join(candidate, "contextarr-pack.json")))
    .map((candidate) => loadValidPack(candidate))
    .sort((left, right) => left.manifest.name.localeCompare(right.manifest.name));

  if (packs.length === 0) {
    throw new StaticRenderError(`No valid pack folders found under: ${packsDir}`);
  }

  const outputDir = path.resolve(options.outputDir);
  ensureDir(outputDir);
  writeStaticAssets(outputDir);
  fs.writeFileSync(path.join(outputDir, "index.html"), renderLibraryPage(packs), "utf8");

  for (const pack of packs) {
    const packOutputDir = path.join(outputDir, "packs", pack.manifest.id);
    renderPackIntoDirectory(pack, packOutputDir, "../..");
  }

  return {
    outputDir,
    entryFile: path.join(outputDir, "index.html"),
    packsRendered: packs.length,
    recordsRendered: packs.reduce((count, pack) => count + pack.records.length, 0),
    packIds: packs.map((pack) => pack.manifest.id)
  };
}

function loadValidPack(packPath: string): StaticPack {
  const resolvedPackPath = path.resolve(packPath);
  const validation = validatePack(resolvedPackPath);
  if (!validation.valid) {
    throw new StaticRenderError(formatValidationResult(validation).trim());
  }

  const manifest = contextPackManifestSchema.parse(
    JSON.parse(fs.readFileSync(path.join(resolvedPackPath, "contextarr-pack.json"), "utf8"))
  );
  const sourceMap = sourceMapSchema.parse(
    YAML.parse(fs.readFileSync(path.join(resolvedPackPath, manifest.sourcesPath), "utf8"))
  );
  const records = listFiles(path.join(resolvedPackPath, manifest.recordsPath))
    .filter((file) => file.toLowerCase().endsWith(".md"))
    .map((file) => {
      const parsed = matter(fs.readFileSync(file, "utf8"));
      return {
        file: normalizePath(path.relative(resolvedPackPath, file)),
        metadata: recordFrontmatterSchema.parse(parsed.data),
        body: parsed.content.trim()
      };
    })
    .sort((left, right) => left.metadata.title.localeCompare(right.metadata.title));
  const exportProfiles = listFiles(path.join(resolvedPackPath, manifest.exportsPath))
    .filter((file) => [".yaml", ".yml"].includes(path.extname(file).toLowerCase()))
    .map((file) => exportProfileSchema.parse(YAML.parse(fs.readFileSync(file, "utf8"))))
    .sort((left, right) => left.name.localeCompare(right.name));
  const changelogPath = path.join(resolvedPackPath, "CHANGELOG.md");

  return {
    packPath: resolvedPackPath,
    manifest,
    validation,
    records,
    sources: sourceMap.sources.sort((left, right) => left.title.localeCompare(right.title)),
    exportProfiles,
    changelogMarkdown: fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, "utf8") : null
  };
}

function renderLibraryPage(packs: StaticPack[]): string {
  const cards = packs
    .map(
      (pack) => `
        <article class="card">
          <p class="eyebrow">${escapeHtml(formatLabel(pack.manifest.type))}</p>
          <h2><a href="packs/${escapeAttribute(pack.manifest.id)}/index.html">${escapeHtml(pack.manifest.name)}</a></h2>
          <p>${escapeHtml(pack.manifest.description)}</p>
          <dl class="meta-grid">
            <div><dt>Records</dt><dd>${pack.records.length}</dd></div>
            <div><dt>Sources</dt><dd>${pack.sources.length}</dd></div>
            <div><dt>Exports</dt><dd>${pack.exportProfiles.length}</dd></div>
          </dl>
        </article>`
    )
    .join("");

  return page("Contextarr Static Library", ".", `
    <section class="hero">
      <p class="eyebrow">Static Library</p>
      <h1>Contextarr Packs</h1>
      <p>Read-only static render of local context packs.</p>
    </section>
    <section class="grid">${cards}</section>
  `);
}

function renderPackIntoDirectory(pack: StaticPack, outputDir: string, rootPrefix: string): void {
  ensureDir(outputDir);
  ensureDir(path.join(outputDir, "records"));
  fs.writeFileSync(path.join(outputDir, "index.html"), renderPackPage(pack, rootPrefix), "utf8");
  const recordRootPrefix = rootPrefix === "." ? ".." : `${rootPrefix}/..`;

  for (const record of pack.records) {
    fs.writeFileSync(
      path.join(outputDir, "records", `${fileSlug(record.metadata.id)}.html`),
      renderRecordPage(pack, record, recordRootPrefix),
      "utf8"
    );
  }
}

function renderPackPage(pack: StaticPack, rootPrefix: string): string {
  const records = pack.records
    .map(
      (record) => `
        <li>
          <a href="records/${fileSlug(record.metadata.id)}.html">${escapeHtml(record.metadata.title)}</a>
          <span>${escapeHtml(formatLabel(record.metadata.type))}</span>
        </li>`
    )
    .join("");
  const sources = pack.sources
    .map(
      (source) => `
        <tr>
          <td>${escapeHtml(source.title)}</td>
          <td>${escapeHtml(formatLabel(source.type))}</td>
          <td>${escapeHtml(source.status ?? "unknown")}</td>
          <td>${escapeHtml(source.path ?? source.url ?? "local")}</td>
        </tr>`
    )
    .join("");
  const exports = pack.exportProfiles
    .map(
      (profile) => `
        <article class="mini-card">
          <h3>${escapeHtml(profile.name)}</h3>
          <p>${escapeHtml(formatLabel(profile.target))} / ${escapeHtml(profile.format)}</p>
          <p>${escapeHtml(profile.privacy_mode ?? "redacted")}</p>
        </article>`
    )
    .join("");
  const changelog = pack.changelogMarkdown
    ? `<section class="panel"><h2>Changelog</h2><div class="markdown">${renderMarkdownToHtml(pack.changelogMarkdown)}</div></section>`
    : "";

  return page(pack.manifest.name, rootPrefix, `
    <p class="crumb"><a href="${rootPrefix}/index.html">Static Library</a></p>
    <section class="hero pack-hero" style="--accent: ${escapeAttribute(pack.manifest.assets.accentColor ?? "#38bdf8")}">
      <p class="eyebrow">${escapeHtml(formatLabel(pack.manifest.type))}</p>
      <h1>${escapeHtml(pack.manifest.name)}</h1>
      <p>${escapeHtml(pack.manifest.description)}</p>
      <dl class="meta-grid">
        <div><dt>Version</dt><dd>${escapeHtml(pack.manifest.version)}</dd></div>
        <div><dt>Trust</dt><dd>${escapeHtml(formatLabel(pack.manifest.trustLevel))}</dd></div>
        <div><dt>Privacy</dt><dd>${pack.manifest.containsPersonalData ? "Contains personal data" : "Public-safe demo"}</dd></div>
      </dl>
    </section>
    <section class="panel"><h2>Overview</h2><p>${escapeHtml(pack.manifest.description)}</p></section>
    <section class="grid stats">
      <article class="mini-card"><strong>${pack.records.length}</strong><span>Records</span></article>
      <article class="mini-card"><strong>${pack.sources.length}</strong><span>Sources</span></article>
      <article class="mini-card"><strong>${pack.exportProfiles.length}</strong><span>Export Profiles</span></article>
      <article class="mini-card"><strong>${pack.validation.summary.errors}</strong><span>Validation Errors</span></article>
    </section>
    <section class="panel"><h2>Records</h2><ul class="record-list">${records}</ul></section>
    <section class="panel"><h2>Sources</h2><div class="table-wrap"><table><thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Reference</th></tr></thead><tbody>${sources}</tbody></table></div></section>
    <section class="panel"><h2>Export Profiles</h2><div class="grid">${exports}</div></section>
    <section class="panel"><h2>Health</h2><p>${pack.validation.valid ? "Validation passed." : "Validation issues found."}</p></section>
    ${changelog}
  `);
}

function renderRecordPage(pack: StaticPack, record: StaticRecord, rootPrefix: string): string {
  const sourceLookup = new Map(pack.sources.map((source) => [source.id, source]));
  const sources = record.metadata.sources
    .map((sourceId) => sourceLookup.get(sourceId))
    .filter((source): source is Source => Boolean(source))
    .map(
      (source) => `
        <li>
          <strong>${escapeHtml(source.title)}</strong>
          <span>${escapeHtml(source.path ?? source.url ?? source.id)}</span>
        </li>`
    )
    .join("");

  return page(record.metadata.title, rootPrefix, `
    <p class="crumb"><a href="../index.html">${escapeHtml(pack.manifest.name)}</a></p>
    <section class="hero">
      <p class="eyebrow">${escapeHtml(formatLabel(record.metadata.type))}</p>
      <h1>${escapeHtml(record.metadata.title)}</h1>
      <dl class="meta-grid">
        <div><dt>Freshness</dt><dd>${escapeHtml(formatLabel(record.metadata.freshness))}</dd></div>
        <div><dt>Privacy</dt><dd>${escapeHtml(formatLabel(record.metadata.privacy))}</dd></div>
        <div><dt>Review</dt><dd>${escapeHtml(formatLabel(record.metadata.review_status))}</dd></div>
      </dl>
    </section>
    <main class="record-layout">
      <article class="panel markdown">${renderMarkdownToHtml(record.body)}</article>
      <aside class="panel">
        <h2>Sources</h2>
        <ul class="source-list">${sources}</ul>
        <h2>Tags</h2>
        <p>${record.metadata.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join(" ")}</p>
      </aside>
    </main>
  `);
}

function page(title: string, rootPrefix: string, body: string): string {
  const homeHref = `${rootPrefix}/index.html`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <title>${escapeHtml(title)} - Contextarr</title>
    <link rel="stylesheet" href="${rootPrefix}/contextarr-static.css" />
  </head>
  <body>
    <div class="shell">
      <header class="site-header">
        <a href="${homeHref}" class="brand">Contextarr</a>
        <span>Static HTML</span>
      </header>
      ${body}
    </div>
  </body>
</html>
`;
}

function writeStaticAssets(outputDir: string): void {
  fs.writeFileSync(
    path.join(outputDir, "contextarr-static.css"),
    `:root{color-scheme:dark;--bg:#080b10;--panel:#111923;--line:#253042;--text:#f5f7fb;--muted:#a8b3c4;--accent:#4f7cff;--green:#55d987}*{box-sizing:border-box}body{margin:0;background:linear-gradient(135deg,#06080d,#0b1118 55%,#07110f);color:var(--text);font-family:Aptos,Segoe UI,system-ui,sans-serif}.shell{max-width:1180px;margin:0 auto;padding:28px}.site-header{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(148,163,184,.18);padding-bottom:18px;margin-bottom:28px;color:var(--muted)}a{color:#8fb0ff;text-decoration:none}a:hover{text-decoration:underline}.brand{color:var(--text);font-size:24px;font-weight:800}.hero,.panel,.card,.mini-card{border:1px solid rgba(148,163,184,.18);border-radius:8px;background:rgba(17,25,35,.82);box-shadow:0 16px 44px rgba(0,0,0,.22)}.hero{padding:28px;margin-bottom:18px;border-color:color-mix(in srgb,var(--accent),transparent 55%)}.eyebrow{margin:0 0 8px;color:#28d4d7;font-size:13px;font-weight:800;text-transform:uppercase}h1{margin:0 0 10px;font-size:42px;line-height:1}h2{margin-top:0}.hero p,.panel p,.card p,.mini-card p,dd{color:var(--muted)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}.card,.mini-card,.panel{padding:18px;margin-bottom:14px}.stats strong{display:block;font-size:34px}.stats span,.crumb,.tag{color:var(--muted)}.meta-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:18px 0 0}.meta-grid div{border:1px solid rgba(148,163,184,.14);border-radius:8px;padding:10px}.meta-grid dt{color:var(--muted);font-size:12px;text-transform:uppercase}.meta-grid dd{margin:4px 0 0;font-weight:700;color:var(--text)}.record-list{display:grid;gap:10px;padding-left:20px}.record-list li span{display:block;color:var(--muted);font-size:14px}.table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid rgba(148,163,184,.16);padding:10px;text-align:left;vertical-align:top}th{color:var(--muted);font-size:12px;text-transform:uppercase}.record-layout{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:14px}.markdown{line-height:1.65}.markdown table{margin:16px 0}.markdown pre{overflow:auto;border:1px solid rgba(148,163,184,.18);border-radius:8px;padding:12px;background:#080b10}.markdown code{color:#bde7ff}.source-list{display:grid;gap:10px;padding-left:18px}.source-list span{display:block;color:var(--muted);font-size:13px}.tag{display:inline-flex;border:1px solid rgba(79,124,255,.28);border-radius:999px;padding:3px 8px;margin:0 4px 4px 0}@media(max-width:760px){.shell{padding:16px}h1{font-size:34px}.record-layout{grid-template-columns:1fr}}`,
    "utf8"
  );
}

function listFiles(root: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function fileSlug(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]+/g, "-");
}

function formatLabel(value: string): string {
  return value
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, "&#96;");
}
