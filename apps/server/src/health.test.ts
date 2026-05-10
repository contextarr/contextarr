import { describe, expect, it } from "vitest";
import type {
  ContextPackManifest,
  ExportProfile,
  RecordFrontmatter,
  SkillExportProfile,
  SkillInstructionFrontmatter,
  SkillManifest,
  Source
} from "@contextarr/schema";
import type { ValidationResult } from "@contextarr/pack-validator";
import type { SkillValidationResult } from "@contextarr/skill-validator";
import { calculateHealthScore, generatePackReviewItems, generateSkippedSkillReviewItems, generateSkillReviewItems } from "./health";
import type { LoadedPack, LoadedRecord, LoadedSkill, LoadedSkillDocument } from "./types";

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
  packId: "health-fixture-pack",
  valid: true,
  validationStatus: "valid",
  issues: [],
  summary: {
    errors: 0,
    warnings: 0,
    infos: 0,
    redactionHits: 0,
    exportProfilesReady: 0,
    exportProfilesWithWarnings: 0,
    exportProfilesBlocked: 0,
    staleSources: 0,
    licenseWarnings: 0,
    licenseMissing: 0,
    licenseUnknown: 0,
    licenseRisks: 0,
    docsWarnings: 0
  },
  redactionHits: [],
  exportReadiness: {
    status: "ready",
    profiles: []
  }
};

const source: Source = {
  id: "fixture.source",
  type: "note",
  title: "Fixture Source"
};

const baseSkillManifest: SkillManifest = {
  id: "health-fixture-skill",
  name: "Health Fixture Skill",
  version: "0.1.0",
  description: "Fake Skill used for health tests.",
  type: "writing_skill",
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
    networkAccess: false,
    browserAutomation: false,
    toolExecution: false
  },
  instructionsPath: "instructions",
  examplesPath: "examples",
  sourcesPath: "sources/sources.yaml",
  exportsPath: "exports",
  rulesPath: "rules",
  targets: ["codex"],
  inputs: ["notes"],
  outputs: ["draft"],
  assets: {},
  compatibility: {
    contextarr: ">=0.2.0"
  }
};

const validSkillValidation: SkillValidationResult = {
  skillPath: "D:/fake/skill",
  valid: true,
  issues: [],
  summary: {
    errors: 0,
    warnings: 0,
    infos: 0
  }
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

describe("Skill health engine", () => {
  it("keeps healthy Skills at 100", () => {
    const items = generateSkillReviewItems(skill(), new Date("2026-05-07T00:00:00.000Z"));

    expect(items).toHaveLength(0);
    expect(calculateHealthScore([])).toMatchObject({ score: 100, status: "healthy", reviewQueueCount: 0 });
  });

  it("generates stale, draft, sensitive export, deprecated, and source coverage Skill items", () => {
    const items = generateSkillReviewItems(
      skill({
        manifest: { trustLevel: "deprecated" },
        instructions: [
          skillDocument({
            id: "fixture.stale",
            title: "Stale Instruction",
            last_reviewed: "2025-01-01"
          }),
          skillDocument({
            id: "fixture.draft",
            title: "Draft Instruction",
            review_status: "draft"
          }),
          skillDocument({
            id: "fixture.sensitive",
            title: "Sensitive Instruction",
            privacy: "sensitive",
            sources: [],
            source_status: "unsourced"
          })
        ],
        exportProfiles: [
          {
            id: "unsafe-skill-export",
            name: "Unsafe Skill Export",
            target: "codex",
            format: "markdown",
            privacy_mode: "redacted",
            include: { instructions: ["fixture.sensitive"] },
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
    expect(items.every((item) => item.objectType === "skill" && item.skillId === "health-fixture-skill")).toBe(true);
    expect(calculateHealthScore(items.map((item) => ({ ...item, status: "open" })))).toMatchObject({
      status: "needs_review",
      reviewQueueCount: items.length
    });
  });

  it("generates example, target, export, safety, and AI-draft Skill health items", () => {
    const items = generateSkillReviewItems(
      skill({
        manifest: {
          targets: ["legacy_prompt", "future_target"]
        },
        validation: {
          ...validSkillValidation,
          valid: true,
          issues: [
            {
              severity: "warning",
              code: "rules.safety_missing",
              message: "Skill safety rules are required.",
              file: "rules/safety.yaml"
            },
            {
              severity: "error",
              code: "scan.hidden_instruction",
              message: "Hidden or deceptive instruction pattern found.",
              file: "instructions/core.md"
            }
          ],
          summary: { errors: 1, warnings: 1, infos: 0 }
        },
        instructions: [
          skillDocument({
            id: "fixture.ai-draft",
            title: "AI Draft Instruction",
            tags: ["ai_draft"],
            review_status: "draft"
          })
        ],
        examples: [],
        exportProfiles: []
      }),
      new Date("2026-05-07T00:00:00.000Z")
    );

    expect(items.map((item) => item.type)).toEqual(
      expect.arrayContaining([
        "safety_rules",
        "disallowed_pattern",
        "example_coverage",
        "target_compatibility",
        "export_readiness",
        "ai_draft"
      ])
    );
  });

  it("sanitizes local paths from skipped Skill review items", () => {
    const items = generateSkippedSkillReviewItems({
      skillPath: "D:\\private\\contextarr\\bad-skill",
      skillId: "bad-skill",
      issues: [
        {
          severity: "error",
          code: "filesystem.read_failed",
          message:
            "EACCES: permission denied, scandir 'D:\\private\\contextarr\\bad-skill\\instructions' and '\\\\corp-fs\\private\\skills\\bad-skill\\instructions'",
          file: "D:\\private\\contextarr\\bad-skill\\instructions",
          path: "D:\\private\\contextarr\\bad-skill\\instructions\\guide.md"
        }
      ]
    });

    expect(JSON.stringify(items)).not.toContain("D:\\private");
    expect(JSON.stringify(items)).not.toContain("D:/private");
    expect(JSON.stringify(items)).not.toContain("corp-fs");
    expect(items[0].metadata).toMatchObject({ file: "instructions", path: "instructions/guide.md" });
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

function skill(overrides: {
  manifest?: Partial<SkillManifest>;
  validation?: SkillValidationResult;
  instructions?: LoadedSkillDocument[];
  examples?: LoadedSkillDocument[];
  exportProfiles?: SkillExportProfile[];
} = {}): LoadedSkill {
  return {
    skillPath: "D:/fake/skill",
    manifest: { ...baseSkillManifest, ...overrides.manifest },
    validation: overrides.validation ?? validSkillValidation,
    instructions: overrides.instructions ?? [skillDocument()],
    examples: overrides.examples ?? [skillDocument({ id: "fixture.example", title: "Fixture Example", type: "example" })],
    sources: [source],
    exportProfiles: overrides.exportProfiles ?? [
      {
        id: "fixture-codex",
        name: "Fixture Codex",
        target: "codex",
        format: "markdown",
        privacy_mode: "redacted",
        include: { instructions: ["fixture.instruction"], examples: ["fixture.example"] },
        exclude_tags: ["secret", "never_export"],
        sections: []
      }
    ]
  };
}

function skillDocument(overrides: Partial<SkillInstructionFrontmatter> = {}): LoadedSkillDocument {
  const metadata: SkillInstructionFrontmatter = {
    id: "fixture.instruction",
    title: "Fixture Instruction",
    type: "instruction_block",
    skill: "health-fixture-skill",
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
    file: `instructions/${metadata.id}.md`,
    metadata,
    body: "Fixture Skill body."
  };
}
