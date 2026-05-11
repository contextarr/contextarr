import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertAgentKitDirectorySeparation,
  assertComposedPackDirectorySeparation,
  assertDraftPackDirectorySeparation,
  assertReviewCandidateDirectorySeparation,
  assertSkillDirectorySeparation,
  getAgentKitIndexDirs,
  getReviewCandidateRoots,
  getSkillIndexDirs,
  loadConfig
} from "./config";

describe("server config", () => {
  it("keeps writable Agent Kits separate from demo Agent Kits by default", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-config-"));
    const config = loadConfig({ INIT_CWD: root });

    expect(config.agentKitsDir).toBe(path.join(root, "agent-kits"));
    expect(config.demoAgentKitsDir).toBe(path.join(root, "demo-agent-kits"));
    expect(config.agentKitTemplatesDir).toBe(path.join(root, "agent-kit-templates"));
    expect(config.importedSkillsDir).toBe(path.join(root, "imported-skills"));
    expect(config.draftPacksDir).toBe(path.join(root, "draft-packs"));
    expect(config.composedPacksDir).toBe(path.join(root, "composed-packs"));
    expect(config.reviewCandidateDirs).toEqual([]);
    expect(config.localImportsEnabled).toBe(false);
  });

  it("allows unauthenticated loopback hosts", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-config-"));

    for (const host of ["localhost", "127.0.0.1", "127.0.1.1", "127.255.255.255", "::1", "[::1]"]) {
      const config = loadConfig({
        INIT_CWD: root,
        CONTEXTARR_HOST: host
      });

      expect(config.host).toBe(host);
      expect(config.apiToken).toBeUndefined();
    }
  });

  it("requires token auth for non-loopback binds", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-config-"));

    for (const host of ["0.0.0.0", "::", "contextarr.local", "192.168.1.10", "10.0.0.5"]) {
      expect(() =>
        loadConfig({
          INIT_CWD: root,
          CONTEXTARR_HOST: host
        })
      ).toThrow(/CONTEXTARR_API_TOKEN is required/);
    }
  });

  it("allows non-loopback binds when token auth is configured", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-config-"));

    const config = loadConfig({
      INIT_CWD: root,
      CONTEXTARR_HOST: "0.0.0.0",
      CONTEXTARR_API_TOKEN: "test-token"
    });

    expect(config.host).toBe("0.0.0.0");
    expect(config.apiToken).toBe("test-token");
  });

  it("rejects indexed and draft Context Pack directory overlap", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-config-"));

    expect(() =>
      loadConfig({
        INIT_CWD: root,
        CONTEXTARR_PACKS_DIR: "./demo-packs",
        CONTEXTARR_DRAFT_PACKS_DIR: "./demo-packs"
      })
    ).toThrow(/must not overlap/);

    expect(() =>
      assertDraftPackDirectorySeparation({
        packsDir: path.join(root, "demo-packs"),
        draftPacksDir: path.join(root, "demo-packs", "drafts")
      })
    ).toThrow(/must not overlap/);
  });

  it("rejects indexed, draft, and composed Context Pack directory overlap", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-config-"));

    expect(() =>
      loadConfig({
        INIT_CWD: root,
        CONTEXTARR_PACKS_DIR: "./demo-packs",
        CONTEXTARR_COMPOSED_PACKS_DIR: "./demo-packs"
      })
    ).toThrow(/must not overlap/);

    expect(() =>
      loadConfig({
        INIT_CWD: root,
        CONTEXTARR_DRAFT_PACKS_DIR: "./draft-packs",
        CONTEXTARR_COMPOSED_PACKS_DIR: "./draft-packs/composed"
      })
    ).toThrow(/must not overlap/);

    expect(() =>
      assertComposedPackDirectorySeparation({
        packsDir: path.join(root, "demo-packs"),
        draftPacksDir: path.join(root, "draft-packs"),
        composedPacksDir: path.join(root, "demo-packs", "composed")
      })
    ).toThrow(/must not overlap/);
  });

  it("parses optional review candidate roots without indexing them", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-config-"));
    const quarantineA = path.join(root, "restored-a");
    const quarantineB = path.join(root, "restored-b");
    const importedRoot = path.join(root, "imported-packs", "phase9-smoke");
    fs.mkdirSync(quarantineA, { recursive: true });
    fs.mkdirSync(quarantineB, { recursive: true });
    fs.mkdirSync(importedRoot, { recursive: true });

    const config = loadConfig({
      INIT_CWD: root,
      CONTEXTARR_REVIEW_CANDIDATE_DIRS: `./restored-a${path.delimiter}${quarantineB}${path.delimiter}${importedRoot}`
    });

    expect(config.reviewCandidateDirs).toEqual([quarantineA, quarantineB, importedRoot]);
    expect(getReviewCandidateRoots(config)).toEqual([
      { rootPath: path.join(root, "draft-packs"), sourceKind: "draft_pack", label: "draft-packs" },
      { rootPath: path.join(root, "composed-packs"), sourceKind: "composed_pack", label: "composed-packs" },
      { rootPath: quarantineA, sourceKind: "restored_quarantine", label: "restored-a" },
      { rootPath: quarantineB, sourceKind: "restored_quarantine", label: "restored-b" },
      { rootPath: importedRoot, sourceKind: "imported_pack", label: "phase9-smoke" }
    ]);
  });

  it("rejects review candidate roots that overlap active Context Packs", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-config-"));

    expect(() =>
      loadConfig({
        INIT_CWD: root,
        CONTEXTARR_PACKS_DIR: "./demo-packs",
        CONTEXTARR_REVIEW_CANDIDATE_DIRS: "./demo-packs"
      })
    ).toThrow(/must not overlap/);

    expect(() =>
      assertReviewCandidateDirectorySeparation({
        packsDir: path.join(root, "demo-packs"),
        reviewCandidateDirs: [path.join(root, "demo-packs", "quarantine")]
      })
    ).toThrow(/must not overlap/);
  });

  it("indexes configured Skills and existing imported Skills without duplicate directories", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-config-"));
    const skillsDir = path.join(root, "demo-skills");
    const importedSkillsDir = path.join(root, "imported-skills");
    fs.mkdirSync(skillsDir, { recursive: true });
    fs.mkdirSync(importedSkillsDir, { recursive: true });

    const config = loadConfig({
      INIT_CWD: root,
      CONTEXTARR_SKILLS_DIR: "./demo-skills",
      CONTEXTARR_IMPORTED_SKILLS_DIR: "./imported-skills",
      CONTEXTARR_ENABLE_LOCAL_IMPORTS: "true"
    });

    expect(config.localImportsEnabled).toBe(true);
    expect(getSkillIndexDirs(config)).toEqual([skillsDir, importedSkillsDir]);
  });

  it("rejects indexed and imported Skill directory overlap", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-config-"));

    expect(() =>
      loadConfig({
        INIT_CWD: root,
        CONTEXTARR_SKILLS_DIR: "./demo-skills",
        CONTEXTARR_IMPORTED_SKILLS_DIR: "./demo-skills"
      })
    ).toThrow(/must not overlap/);

    expect(() =>
      assertSkillDirectorySeparation({
        skillsDir: path.join(root, "demo-skills"),
        importedSkillsDir: path.join(root, "demo-skills", "drafts")
      })
    ).toThrow(/must not overlap/);
  });

  it("indexes demo kits and existing local saved kits without duplicate directories", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-config-"));
    const agentKitsDir = path.join(root, "agent-kits");
    const demoAgentKitsDir = path.join(root, "demo-agent-kits");
    fs.mkdirSync(agentKitsDir, { recursive: true });
    fs.mkdirSync(demoAgentKitsDir, { recursive: true });

    const config = loadConfig({
      INIT_CWD: root,
      CONTEXTARR_AGENT_KITS_DIR: "./agent-kits",
      CONTEXTARR_DEMO_AGENT_KITS_DIR: "./demo-agent-kits"
    });

    expect(getAgentKitIndexDirs(config)).toEqual([demoAgentKitsDir, agentKitsDir]);
  });

  it("rejects writable and demo Agent Kit directory overlap", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-config-"));

    expect(() =>
      loadConfig({
        INIT_CWD: root,
        CONTEXTARR_AGENT_KITS_DIR: "./demo-agent-kits",
        CONTEXTARR_DEMO_AGENT_KITS_DIR: "./demo-agent-kits"
      })
    ).toThrow(/must not overlap/);

    expect(() =>
      loadConfig({
        INIT_CWD: root,
        CONTEXTARR_AGENT_KITS_DIR: "./demo-agent-kits/local",
        CONTEXTARR_DEMO_AGENT_KITS_DIR: "./demo-agent-kits"
      })
    ).toThrow(/must not overlap/);
  });

  it("uses real filesystem paths when checking Agent Kit directory separation", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-config-"));
    const realDemoDir = path.join(root, "demo-agent-kits");
    const linkedWritableDir = path.join(root, "agent-kits-link");
    const linkedWritableChildDir = path.join(linkedWritableDir, "drafts");
    fs.mkdirSync(realDemoDir, { recursive: true });

    try {
      fs.symlinkSync(realDemoDir, linkedWritableDir, "junction");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EPERM" || (error as NodeJS.ErrnoException).code === "EACCES") {
        return;
      }
      throw error;
    }

    expect(() =>
      assertAgentKitDirectorySeparation({
        agentKitsDir: linkedWritableDir,
        demoAgentKitsDir: realDemoDir
      })
    ).toThrow(/must not overlap/);

    expect(() =>
      assertAgentKitDirectorySeparation({
        agentKitsDir: linkedWritableChildDir,
        demoAgentKitsDir: realDemoDir
      })
    ).toThrow(/must not overlap/);
  });
});
