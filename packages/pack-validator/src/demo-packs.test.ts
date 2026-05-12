import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import YAML from "yaml";
import { describe, expect, it } from "vitest";
import { validatePack } from "./index";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const demoPacksDir = path.join(repoRoot, "demo-packs");

const expectedPackIds = [
  "ai-workstation-pack",
  "aws-infrastructure-pack",
  "claude-code-project-pack",
  "docker-containers-pack",
  "fake-product-line-pack",
  "github-workflow-pack",
  "google-workspace-pack",
  "home-assistant-pack",
  "internal-support-kb-pack",
  "jellyfin-media-server-pack",
  "obsidian-vault-pack",
  "openai-prompt-engineering-pack",
  "tailscale-vpn-pack",
  "unifi-network-pack",
  "vscode-setup-pack"
];

const starterPackMetadata = [
  ["openai-prompt-engineering-pack", "ai_prompting", 1, "openai"],
  ["claude-code-project-pack", "ai_coding", 2, "claude"],
  ["google-workspace-pack", "productivity", 3, "google"],
  ["aws-infrastructure-pack", "cloud_infrastructure", 4, "aws"],
  ["jellyfin-media-server-pack", "self_hosted_media", 5, "jellyfin"],
  ["docker-containers-pack", "containers", 6, "docker"],
  ["unifi-network-pack", "networking", 7, "unifi"],
  ["vscode-setup-pack", "development_environment", 8, "vscode"],
  ["github-workflow-pack", "devops_collaboration", 9, "github"],
  ["home-assistant-pack", "home_automation", 10, "homeassistant"],
  ["tailscale-vpn-pack", "networking_security", 11, "tailscale"],
  ["obsidian-vault-pack", "local_markdown_knowledge", 12, "obsidian"]
] as const;

const starterPackIds: ReadonlySet<string> = new Set(starterPackMetadata.map(([packId]) => packId));
const expectedStarterTrustLevels = new Set(["curated", "verified", "community"]);
const expectedExportTargets = new Set(["chatgpt", "claude", "codex", "generic_markdown", "json", "agents_md", "claude_md", "llms_txt"]);
const requiredExportExcludeTags = ["secret", "never_export", "imported_draft"];

const requiredFiles = [
  "contextarr-pack.json",
  "README.md",
  "CHANGELOG.md",
  "LICENSE",
  "sources/sources.yaml",
  "exports/chatgpt.yaml",
  "exports/claude.yaml",
  "exports/codex.yaml",
  "exports/markdown.yaml",
  "exports/json-records.yaml",
  "exports/agents-md.yaml",
  "exports/claude-md.yaml",
  "exports/llms-txt.yaml",
  "examples/sample-agents-md.md",
  "examples/sample-claude-md.md",
  "examples/sample-llms-txt.txt",
  "rules/validation.yaml",
  "rules/redaction.yaml",
  "rules/freshness.yaml"
];

describe("demo packs", () => {
  it("includes the expected public-safe demo pack directories", () => {
    const actualPackIds = fs
      .readdirSync(demoPacksDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    expect(actualPackIds).toEqual([...expectedPackIds].sort());
  });

  it.each(expectedPackIds)("%s has the required files and expected records", (packId) => {
    const packPath = path.join(demoPacksDir, packId);

    for (const requiredFile of requiredFiles) {
      expect(fs.existsSync(path.join(packPath, requiredFile)), `${packId} missing ${requiredFile}`).toBe(true);
    }

    for (const requiredSample of ["sample-chatgpt.md", "sample-claude.md", "sample-codex.md"]) {
      expect(
        fs.existsSync(path.join(packPath, "examples", requiredSample)),
        `${packId} missing examples/${requiredSample}`
      ).toBe(true);
    }

    const recordFiles = fs.readdirSync(path.join(packPath, "records")).filter((file) => file.endsWith(".md"));
    const exportFiles = fs.readdirSync(path.join(packPath, "exports")).filter((file) => file.endsWith(".yaml"));

    expect(recordFiles).toHaveLength(8);
    expect(exportFiles).toHaveLength(8);
  });

  it("marks exactly the 12 curated starter Context Packs", () => {
    const starterIds = expectedPackIds
      .map((packId) => readManifest(packId))
      .filter((manifest) => manifest.starterPack === true)
      .map((manifest) => manifest.id)
      .sort();

    expect(starterIds).toEqual([...starterPackIds].sort());
  });

  it.each(starterPackMetadata)("%s preserves starter metadata and local brand references", (packId, category, sortOrder, brandId) => {
    const manifest = readManifest(packId);

    expect(manifest).toMatchObject({
      id: packId,
      visibility: "local",
      containsPersonalData: false,
      containsExecutableCode: false,
      requiresNetwork: false,
      starterPack: true,
      starterCategory: category,
      starterSortOrder: sortOrder,
      permissions: {
        readVault: false,
        writeDrafts: false,
        runCommands: false,
        networkAccess: false
      },
      assets: {
        brandId,
        coverRecipe: "brand_hex_v1",
        logoVariant: "auto"
      }
    });
    expect(expectedStarterTrustLevels.has(manifest.trustLevel)).toBe(true);
    expect(manifest.lastReviewedAt).toMatch(/^2026-05-09T00:00:00Z$/);
    expect(manifest.assets?.accentColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(JSON.stringify(manifest.assets ?? {})).not.toMatch(/https?:\/\//i);
  });

  it.each(starterPackMetadata)("%s keeps starter records approved, public-safe, and source-backed", (packId, category) => {
    const { records, sourceIds } = readStarterRecordAndSourceIds(packId);

    expect(records).toHaveLength(8);
    expect(sourceIds).toHaveLength(8);
    expect(new Set(sourceIds).size).toBe(8);

    for (const record of records) {
      expect(record.pack).toBe(packId);
      expect(record.tags).toEqual(expect.arrayContaining(["starter", "public_safe", category]));
      expect(record.privacy).toBe("public_safe");
      expect(record.review_status).toBe("approved");
      expect(record.source_status).toBe("source_backed");
      expect(record.freshness).toBe("current");
      expect(dateOnly(record.last_reviewed)).toBe("2026-05-09");
      expect(record.sources).toHaveLength(1);
      expect(sourceIds).toContain(record.sources[0]);
    }
  });

  it.each(starterPackMetadata)("%s keeps starter source maps synthetic, permissive, and local-only", (packId) => {
    const sources = readSources(packId);

    expect(sources).toHaveLength(8);
    for (const source of sources) {
      expect(source).toMatchObject({
        license: "MIT",
        license_status: "known_permissive",
        status: "current"
      });
      expect(expectedStarterTrustLevels.has(source.trust)).toBe(true);
      expect(source.type).toBeTruthy();
      expect(source.path).toMatch(/^raw\/[a-z0-9-]+\.md$/);
      expect(path.isAbsolute(source.path)).toBe(false);
      expect(source.path).not.toMatch(/https?:\/\//i);
      expect(fs.existsSync(path.join(demoPacksDir, packId, source.path))).toBe(true);
      expect(source.license_notes).toContain("Original public-safe demo source");
    }
  });

  it.each(expectedPackIds)("%s keeps source paths pack-local and backed by raw notes", (packId) => {
    const sources = readSources(packId);
    const packPath = path.join(demoPacksDir, packId);

    for (const source of sources) {
      expect(source.path).toMatch(/^raw\/[a-z0-9-]+\.md$/);
      expect(path.isAbsolute(source.path)).toBe(false);
      expect(source.path).not.toContain("..");
      expect(source.path).not.toMatch(/https?:\/\//i);
      expect(fs.existsSync(path.join(packPath, source.path))).toBe(true);
    }
  });

  it.each(starterPackMetadata)("%s keeps starter export profiles redacted and record-complete", (packId) => {
    const recordIds = readStarterRecordAndSourceIds(packId).records.map((record) => record.id).sort();
    const exportProfiles = readExportProfiles(packId);

    expect(exportProfiles).toHaveLength(8);
    expect(exportProfiles.map((profile) => profile.target).sort()).toEqual([...expectedExportTargets].sort());

    for (const profile of exportProfiles) {
      expect(profile.privacy_mode).toBe("redacted");
      expect(profile.exclude_tags).toEqual(expect.arrayContaining(requiredExportExcludeTags));
      expect(profile.include?.records?.slice().sort()).toEqual(recordIds);
      expect(profile.token_budget).toBeGreaterThan(0);
    }
  });

  it.each(expectedPackIds)("%s validates with zero errors and warnings", (packId) => {
    const result = validatePack(path.join(demoPacksDir, packId));

    expect(result.summary.errors, JSON.stringify(result.issues, null, 2)).toBe(0);
    expect(result.summary.warnings, JSON.stringify(result.issues, null, 2)).toBe(0);
    expect(result.exportReadiness.status).toBe("ready");
    expect(result.summary.exportProfilesReady).toBe(8);
    expect(result.valid).toBe(true);
  });
});

function readManifest(packId: string): Record<string, any> {
  return JSON.parse(fs.readFileSync(path.join(demoPacksDir, packId, "contextarr-pack.json"), "utf8"));
}

function readSources(packId: string): Array<Record<string, any>> {
  const parsed = YAML.parse(fs.readFileSync(path.join(demoPacksDir, packId, "sources", "sources.yaml"), "utf8"));
  return parsed.sources;
}

function readExportProfiles(packId: string): Array<Record<string, any>> {
  return fs
    .readdirSync(path.join(demoPacksDir, packId, "exports"))
    .filter((file) => file.endsWith(".yaml"))
    .sort()
    .map((file) => YAML.parse(fs.readFileSync(path.join(demoPacksDir, packId, "exports", file), "utf8")));
}

function readStarterRecordAndSourceIds(packId: string): {
  records: Array<Record<string, any>>;
  sourceIds: string[];
} {
  const records = fs
    .readdirSync(path.join(demoPacksDir, packId, "records"))
    .filter((file) => file.endsWith(".md"))
    .sort()
    .map((file) => matter(fs.readFileSync(path.join(demoPacksDir, packId, "records", file), "utf8")).data as Record<string, any>);
  const sourceIds = readSources(packId).map((source) => source.id);

  return { records, sourceIds };
}

function dateOnly(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value);
}
