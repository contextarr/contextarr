import { describe, expect, it } from "vitest";
import {
  agentKitCompatibilityRulesSchema,
  agentKitExportProfileSchema,
  agentKitManifestSchema,
  contextPackManifestSchema,
  exportProfileSchema,
  recordFrontmatterSchema,
  skillExportProfileSchema,
  skillInstructionFrontmatterSchema,
  skillManifestSchema,
  skillSafetyRulesSchema,
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

  it("accepts non-executable Skill manifests and instruction frontmatter", () => {
    expect(
      skillManifestSchema.safeParse({
        id: "support-ticket-writing",
        name: "Support Ticket Writing",
        version: "1.0.0",
        description: "Reusable instructions for drafting clear support tickets.",
        type: "writing_skill",
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
        targets: ["chatgpt", "claude", "codex"],
        inputs: ["issue_notes"],
        outputs: ["ticket_draft"],
        assets: {
          accentColor: "#7c3aed"
        },
        compatibility: {
          contextarr: ">=0.2.0"
        }
      }).success
    ).toBe(true);

    expect(
      skillInstructionFrontmatterSchema.safeParse({
        id: "support-ticket-writing.core",
        title: "Core Ticket Writing Instructions",
        type: "instruction_block",
        skill: "support-ticket-writing",
        tags: ["support", "writing"],
        confidence: "high",
        source_status: "authored",
        freshness: "current",
        privacy: "public_safe",
        last_reviewed: "2026-05-07",
        sources: ["manual-authoring"],
        review_status: "approved"
      }).success
    ).toBe(true);
  });

  it("accepts Skill export profiles and safety rules", () => {
    expect(
      skillExportProfileSchema.safeParse({
        id: "support-ticket-writing-chatgpt",
        name: "Support Ticket Writing for ChatGPT",
        target: "chatgpt",
        format: "markdown",
        privacy_mode: "redacted",
        include: {
          instructions: ["support-ticket-writing.core"],
          examples: ["support-ticket-writing.good-ticket"]
        },
        exclude_tags: ["secret", "never_export"],
        token_budget: 4000,
        sections: ["instructions", "examples", "safety"]
      }).success
    ).toBe(true);

    expect(
      skillSafetyRulesSchema.safeParse({
        disallowed: {
          executable_files: true,
          shell_commands: true,
          network_calls: true,
          credential_requests: true,
          browser_automation: true,
          hidden_prompts: true,
          tool_execution: true
        },
        patterns: [
          {
            name: "credential_request",
            regex: "(api key|password|token)",
            severity: "high",
            action: "review"
          }
        ]
      }).success
    ).toBe(true);
  });

  it("accepts non-executable Agent Kit manifests, export profiles, and compatibility rules", () => {
    expect(
      agentKitManifestSchema.safeParse({
        id: "support-ticket-kit",
        name: "Support Ticket Agent Kit",
        version: "1.0.0",
        description: "Combines fake support context and non-executable Skill instructions.",
        type: "support_workflow",
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
          writeDrafts: false,
          runCommands: false,
          networkAccess: false,
          browserAutomation: false,
          toolExecution: false
        },
        contextPacks: ["internal-support-kb-pack"],
        skills: ["support-ticket-writing-skill"],
        target: "codex",
        exportProfile: "support-ticket-kit-codex",
        privacyMode: "redacted",
        tokenBudget: 12000,
        rulesPath: "rules",
        exportsPath: "exports",
        examplesPath: "examples",
        assets: {
          accentColor: "#22c55e"
        },
        compatibility: {
          contextarr: ">=0.3.0"
        }
      }).success
    ).toBe(true);

    expect(
      agentKitExportProfileSchema.safeParse({
        id: "support-ticket-kit-codex",
        name: "Support Ticket Agent Kit Codex Export",
        target: "codex",
        format: "markdown",
        privacy_mode: "redacted",
        include: {
          context_packs: ["internal-support-kb-pack"],
          skills: ["support-ticket-writing-skill"]
        },
        exclude_tags: ["secret", "never_export"],
        token_budget: 12000,
        sections: ["kit_summary", "included_skills", "relevant_context"]
      }).success
    ).toBe(true);

    expect(
      agentKitCompatibilityRulesSchema.safeParse({
        supported_targets: ["codex"],
        required_context_packs: ["internal-support-kb-pack"],
        required_skills: ["support-ticket-writing-skill"],
        allow_unreviewed_drafts: false,
        blocked_trust_levels: ["blocked"],
        pairings: [
          {
            context_pack: "internal-support-kb-pack",
            skill: "support-ticket-writing-skill",
            target: "codex",
            status: "supported"
          }
        ]
      }).success
    ).toBe(true);
  });

  it("rejects Agent Kit capability drift fields at schema boundaries", () => {
    expect(
      agentKitManifestSchema.safeParse({
        id: "bad-kit",
        name: "Bad Kit",
        version: "1.0.0",
        description: "Invalid fixture.",
        type: "support_workflow",
        visibility: "local",
        trustLevel: "local",
        author: "Contextarr Tests",
        license: "MIT",
        createdAt: "2026-05-07T00:00:00Z",
        updatedAt: "2026-05-07T00:00:00Z",
        lastReviewedAt: null,
        containsPersonalData: false,
        containsExecutableCode: false,
        requiresNetwork: false,
        contextPacks: ["valid-minimal-pack"],
        skills: ["valid-skill"],
        target: "codex",
        exportProfile: "bad-kit-codex",
        privacyMode: "redacted",
        rulesPath: "rules",
        exportsPath: "exports",
        compatibility: {
          contextarr: ">=0.3.0"
        },
        telemetry: {
          enabled: true
        }
      }).success
    ).toBe(false);
  });
});
