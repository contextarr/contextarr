import { describe, expect, it } from "vitest";
import type { ContextPackManifest, ExportProfile, RecordFrontmatter, Source } from "@contextarr/schema";
import type { ValidationResult } from "@contextarr/pack-validator";
import { calculateHealthScore, generatePackReviewItems } from "./health";
import type { LoadedPack, LoadedRecord } from "./types";

const baseManifest: ContextPackManifest = {
  id: "health-fixture-pack",
  name: "Health Fixture Pack",
  version: "0.1.0",
  description: "Fake pack used for health tests.",
  type: "technical_system",
  visibility: "local",
  trustLevel: "local",
  author: "Contextarr",
  license: "Apache-2.0",
  createdAt: "2026-05-01T00:00:00.000Z",
  updatedAt: "2026-05-07T00:00:00.000Z",
  lastReviewedAt: "2026-05-07T00:00:00.000Z",
  containsPersonalData: false,
  containsExecutableCode: false,
  requiresNetwork: false,
  permissions: {
    readVault: false,
    writeDrafts: false,
    runCommands: false,
    networkAccess: false
  },
  recordsPath: "records",
  sourcesPath: "sources/sources.yaml",
  exportsPath: "exports",
  rulesPath: "rules",
  assets: {},
  compatibility: {
    contextarr: ">=0.1.0"
  }
};

const validValidation: ValidationResult = {
  packPath: "D:/fake/pack",
  valid: true,
  issues: [],
  summary: {
    errors: 0,
    warnings: 0,
    infos: 0
  }
};

const source: Source = {
  id: "fixture.source",
  type: "note",
  title: "Fixture Source"
};

describe("Pack health engine", () => {
  it("keeps healthy packs at 100", () => {
    const items = generatePackReviewItems(pack(), new Date("2026-05-07T00:00:00.000Z"));

    expect(items).toHaveLength(0);
    expect(calculateHealthScore([])).toMatchObject({ score: 100, status: "healthy", reviewQueueCount: 0 });
  });

  it("generates stale, draft, sensitive export, deprecated, and source coverage items", () => {
    const items = generatePackReviewItems(
      pack({
        manifest: { trustLevel: "deprecated" },
        records: [
          record({
            id: "fixture.stale",
            title: "Stale Record",
            last_reviewed: "2026-01-01"
          }),
          record({
            id: "fixture.draft",
            title: "Draft Record",
            review_status: "draft"
          }),
          record({
            id: "fixture.sensitive",
            title: "Sensitive Record",
            privacy: "sensitive",
            sources: [],
            source_status: "unsourced"
          })
        ],
        exportProfiles: [
          {
            id: "unsafe-export",
            name: "Unsafe Export",
            target: "chatgpt",
            format: "markdown",
            privacy_mode: "redacted",
            include: { records: ["fixture.sensitive"] },
            exclude_tags: [],
            sections: []
          }
        ]
      }),
      new Date("2026-05-07T00:00:00.000Z")
    );

    expect(items.map((item) => item.type)).toEqual(
      expect.arrayContaining(["freshness", "review_status", "export_safety", "trust", "source_coverage"])
    );
    expect(calculateHealthScore(items.map((item) => ({ ...item, status: "open" })))).toMatchObject({
      status: "needs_review",
      reviewQueueCount: items.length
    });
  });
});

function pack(overrides: {
  manifest?: Partial<ContextPackManifest>;
  records?: LoadedRecord[];
  exportProfiles?: ExportProfile[];
} = {}): LoadedPack {
  return {
    packPath: "D:/fake/pack",
    manifest: { ...baseManifest, ...overrides.manifest },
    validation: validValidation,
    records: overrides.records ?? [record()],
    sources: [source],
    exportProfiles: overrides.exportProfiles ?? []
  };
}

function record(overrides: Partial<RecordFrontmatter> = {}): LoadedRecord {
  const metadata: RecordFrontmatter = {
    id: "fixture.record",
    title: "Fixture Record",
    type: "technical_system",
    pack: "health-fixture-pack",
    tags: ["fixture"],
    confidence: "high",
    source_status: "source_backed",
    freshness: "current",
    privacy: "public_safe",
    last_reviewed: "2026-05-07",
    sources: ["fixture.source"],
    review_status: "approved",
    ...overrides
  };

  return {
    file: `records/${metadata.id}.md`,
    metadata,
    body: "Fixture body."
  };
}
