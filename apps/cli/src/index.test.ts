import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { runCli } from "./index";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const fixturesDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../packages/pack-validator/test/fixtures"
);
const demoPacksDir = path.join(repoRoot, "demo-packs");
const tempDirs: string[] = [];

function fixture(name: string): string {
  return path.join(fixturesDir, name);
}

function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "contextarr-cli-"));
  tempDirs.push(dir);
  return dir;
}

function createIo() {
  let stdout = "";
  let stderr = "";

  return {
    io: {
      stdout: {
        write(value: string) {
          stdout += value;
          return true;
        }
      },
      stderr: {
        write(value: string) {
          stderr += value;
          return true;
        }
      }
    },
    get stdout() {
      return stdout;
    },
    get stderr() {
      return stderr;
    }
  };
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("contextarr CLI", () => {
  it("returns 0 for a valid pack", async () => {
    const output = createIo();
    const code = await runCli(["validate", fixture("valid-minimal-pack")], output.io);

    expect(code).toBe(0);
    expect(output.stdout).toContain("Validation passed");
    expect(output.stderr).toBe("");
  });

  it("resolves relative paths from the original pnpm invocation directory", async () => {
    const output = createIo();
    const previousInitCwd = process.env.INIT_CWD;
    process.env.INIT_CWD = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

    try {
      const code = await runCli(["validate", "packages/pack-validator/test/fixtures/valid-minimal-pack"], output.io);

      expect(code).toBe(0);
      expect(output.stdout).toContain("Validation passed");
    } finally {
      if (previousInitCwd === undefined) {
        delete process.env.INIT_CWD;
      } else {
        process.env.INIT_CWD = previousInitCwd;
      }
    }
  });

  it("returns 1 for validation errors and supports JSON output", async () => {
    const output = createIo();
    const code = await runCli(["validate", fixture("missing-manifest-pack"), "--format", "json"], output.io);

    expect(code).toBe(1);
    expect(JSON.parse(output.stdout)).toMatchObject({
      valid: false,
      summary: {
        errors: expect.any(Number)
      }
    });
  });

  it("validates a directory of child packs", async () => {
    const output = createIo();
    const code = await runCli(["validate", demoPacksDir, "--format", "json"], output.io);
    const json = JSON.parse(output.stdout);

    expect(code).toBe(0);
    expect(json).toMatchObject({
      valid: true,
      summary: {
        errors: 0,
        warnings: 0,
        infos: 0
      }
    });
    expect(json.results).toHaveLength(5);
  });

  it("returns 2 for usage or read failures", async () => {
    const output = createIo();
    const code = await runCli(["validate", "does-not-exist"], output.io);

    expect(code).toBe(2);
    expect(output.stderr).toContain("Pack path is not a readable directory");
  });

  it("renders a valid pack to static HTML", async () => {
    const output = createIo();
    const outDir = tempDir();
    const code = await runCli(["render", path.join(demoPacksDir, "ai-workstation-pack"), "--out", outDir], output.io);

    expect(code).toBe(0);
    expect(output.stdout).toContain("Rendered 1 pack(s), 5 record(s)");
    expect(fs.readFileSync(path.join(outDir, "index.html"), "utf8")).toContain("AI Workstation Pack");
    expect(fs.existsSync(path.join(outDir, "records", "ai-workstation.local-ai-stack.html"))).toBe(true);
  });

  it("renders all demo packs to static HTML", async () => {
    const output = createIo();
    const outDir = tempDir();
    const code = await runCli(["render", demoPacksDir, "--out", outDir], output.io);

    expect(code).toBe(0);
    expect(output.stdout).toContain("Rendered 5 pack(s), 25 record(s)");
    expect(fs.existsSync(path.join(outDir, "packs", "ai-workstation-pack", "index.html"))).toBe(true);
  });

  it("returns 1 for invalid pack render failures", async () => {
    const output = createIo();
    const outDir = tempDir();
    const code = await runCli(["render", fixture("invalid-permissions-pack"), "--out", outDir], output.io);

    expect(code).toBe(1);
    expect(output.stderr).toContain("Validation failed");
  });

  it("exports a single profile to generated files", async () => {
    const output = createIo();
    const outDir = tempDir();
    const code = await runCli(
      ["export", path.join(demoPacksDir, "ai-workstation-pack"), "--profile", "ai-workstation-chatgpt", "--out", outDir],
      output.io
    );

    expect(code).toBe(0);
    expect(output.stdout).toContain("Exported 1 file(s)");
    expect(fs.readFileSync(path.join(outDir, "ai-workstation-pack", "ai-workstation-chatgpt.md"), "utf8")).toContain(
      "ChatGPT Context Export"
    );
  });

  it("exports all profiles for all demo packs", async () => {
    const output = createIo();
    const outDir = tempDir();
    const code = await runCli(["export", demoPacksDir, "--all", "--out", outDir], output.io);

    expect(code).toBe(0);
    expect(output.stdout).toContain("Exported 25 file(s)");
    expect(fs.existsSync(path.join(outDir, "ai-workstation-pack", "ai-workstation-json-records.json"))).toBe(true);
    expect(fs.existsSync(path.join(outDir, "jellyfin-server-pack", "jellyfin-server-markdown.md"))).toBe(true);
  });

  it("returns non-zero for invalid export usage and missing profiles", async () => {
    const usageOutput = createIo();
    const missingProfileOutput = createIo();
    const outDir = tempDir();

    expect(await runCli(["export", path.join(demoPacksDir, "ai-workstation-pack"), "--out", outDir], usageOutput.io)).toBe(2);
    expect(usageOutput.stderr).toContain("Choose exactly one export mode");

    expect(
      await runCli(
        ["export", path.join(demoPacksDir, "ai-workstation-pack"), "--profile", "missing-profile", "--out", outDir],
        missingProfileOutput.io
      )
    ).toBe(1);
    expect(missingProfileOutput.stderr).toContain("Export profile not found");
  });
});
