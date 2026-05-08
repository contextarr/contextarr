import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { assertAgentKitDirectorySeparation, getAgentKitIndexDirs, loadConfig } from "./config";

describe("server config", () => {
  it("keeps writable Agent Kits separate from demo Agent Kits by default", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-config-"));
    const config = loadConfig({ INIT_CWD: root });

    expect(config.agentKitsDir).toBe(path.join(root, "agent-kits"));
    expect(config.demoAgentKitsDir).toBe(path.join(root, "demo-agent-kits"));
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
