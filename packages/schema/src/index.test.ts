import { describe, expect, it } from "vitest";
import {
  contextPackManifestSchema,
  exportProfileSchema,
  recordFrontmatterSchema,
  sourceMapSchema
} from "./index";

describe("Contextarr schemas", () => {
  it("accepts the PRD manifest shape", () => {
    const result = contextPackManifestSchema.safeParse({
      id: "ai-workstation-pack",
      name: "AI Workstation Pack",
      version: "1.0.0",
      description: "Essential context for AI-powered developer workstations.",
      type: "technical_system",
      visibility: "local",
      trustLevel: "local",
      author: "Contextarr Demo",
      license: "MIT",
      createdAt: "2026-05-07T00:00:00Z",
      updatedAt: "2026-05-07T00:00:00Z",
      lastReviewedAt: null,
      containsPersonalData: false,
      containsExecutableCode: false,
      requiresNetwork: false,
      permissions: {
        readVault: false,
        writeDrafts: true,
        runCommands: false,
        networkAccess: false
      },
      recordsPath: "records",
      sourcesPath: "sources/sources.yaml",
      exportsPath: "exports",
      rulesPath: "rules",
      assets: {
        coverImage: "assets/cover.png",
        accentColor: "#3b82f6"
      },
      compatibility: {
        contextarr: ">=0.1.0"
      }
    });

    expect(result.success).toBe(true);
  });

  it("accepts record frontmatter from the PRD", () => {
    const result = recordFrontmatterSchema.safeParse({
      id: "ai-workstation.local-ai-stack",
      title: "Local AI Stack",
      type: "system_component",
      pack: "ai-workstation-pack",
      tags: ["ai", "local", "stack", "inference"],
      confidence: "high",
      source_status: "source_backed",
      freshness: "current",
      privacy: "public_safe",
      last_reviewed: "2026-05-07",
      sources: ["ollama-docs"],
      review_status: "approved"
    });

    expect(result.success).toBe(true);
  });

  it("rejects unsafe manifest field types", () => {
    const result = contextPackManifestSchema.safeParse({
      id: "bad-pack",
      name: "Bad Pack",
      version: "1.0.0"
    });

    expect(result.success).toBe(false);
  });

  it("accepts source maps and export profiles", () => {
    expect(
      sourceMapSchema.safeParse({
        sources: [
          {
            id: "manual-note",
            type: "markdown",
            title: "Manual Note",
            path: "../raw/note.md",
            retrieved_at: "2026-05-07T00:00:00Z",
            trust: "local",
            status: "current"
          }
        ]
      }).success
    ).toBe(true);

    expect(
      exportProfileSchema.safeParse({
        id: "codex-project-context",
        name: "Codex Project Context",
        target: "codex",
        format: "markdown",
        privacy_mode: "redacted",
        include: {
          records: ["ai-workstation.local-ai-stack"]
        },
        exclude_tags: ["secret"],
        token_budget: 16000,
        sections: ["summary", "constraints", "sources"]
      }).success
    ).toBe(true);
  });
});
