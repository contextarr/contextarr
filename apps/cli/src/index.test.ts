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
const importFixturesDir = path.join(repoRoot, "packages/importers/test/fixtures");
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

  it("returns 2 for validation errors and supports legacy JSON output", async () => {
    const output = createIo();
    const code = await runCli(["validate", fixture("missing-manifest-pack"), "--format", "json"], output.io);

    expect(code).toBe(2);
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

  it("supports the stable validate --json envelope", async () => {
    const output = createIo();
    const code = await runCli(["validate", fixture("valid-minimal-pack"), "--json"], output.io);
    const json = JSON.parse(output.stdout);

    expect(code).toBe(0);
    expect(output.stderr).toBe("");
    expect(json).toMatchObject({
      schemaVersion: "contextarr.cli-result.v1",
      command: "validate",
      status: "success",
      ok: true,
      data: {
        valid: true,
        summary: {
          packs: 1,
          errors: 0
        }
      },
      meta: {
        contextarrVersion: "0.0.0",
        redacted: false
      }
    });
  });

  it("uses stable JSON in agent mode without --json", async () => {
    const output = createIo();
    const code = await runCli(["validate", fixture("missing-manifest-pack"), "--agent"], output.io);
    const json = JSON.parse(output.stdout);

    expect(code).toBe(2);
    expect(output.stderr).toBe("");
    expect(json).toMatchObject({
      schemaVersion: "contextarr.cli-result.v1",
      command: "validate",
      status: "failed",
      ok: false,
      errors: [
        expect.objectContaining({
          code: "manifest.missing"
        })
      ],
      meta: {
        redacted: true
      }
    });
  });

  it("returns 5 for missing validation paths", async () => {
    const output = createIo();
    const code = await runCli(["validate", "does-not-exist"], output.io);

    expect(code).toBe(5);
    expect(output.stderr).toContain("Pack path is not a readable directory");
  });

  it("imports a Markdown folder to a generated draft pack", async () => {
    const output = createIo();
    const outDir = tempDir();
    const code = await runCli(
      [
        "import",
        path.join(importFixturesDir, "markdown-folder"),
        "--kind",
        "markdown",
        "--out",
        outDir,
        "--pack-id",
        "cli-markdown-import",
        "--format",
        "json"
      ],
      output.io
    );
    const json = JSON.parse(output.stdout);

    expect(code).toBe(0);
    expect(json).toMatchObject({
      packId: "cli-markdown-import",
      counts: {
        records: 2,
        sources: 2
      },
      validation: {
        valid: true,
        errors: 0
      }
    });
    expect(fs.existsSync(path.join(outDir, "cli-markdown-import", "contextarr-pack.json"))).toBe(true);
  });

  it("supports import dry-run in agent JSON mode without writing files", async () => {
    const output = createIo();
    const outDir = tempDir();
    const code = await runCli(
      [
        "import",
        path.join(importFixturesDir, "markdown-folder"),
        "--kind",
        "markdown",
        "--out",
        outDir,
        "--pack-id",
        "cli-markdown-dry-run",
        "--dry-run",
        "--agent"
      ],
      output.io
    );
    const json = JSON.parse(output.stdout);

    expect(code).toBe(0);
    expect(json).toMatchObject({
      schemaVersion: "contextarr.cli-result.v1",
      command: "import",
      ok: true,
      data: {
        dryRun: true,
        packId: "cli-markdown-dry-run",
        records: {
          wouldImport: 2
        }
      }
    });
    expect(fs.existsSync(path.join(outDir, "cli-markdown-dry-run", "contextarr-pack.json"))).toBe(false);
  });

  it("blocks import writes in agent mode without --yes", async () => {
    const output = createIo();
    const outDir = tempDir();
    const code = await runCli(
      [
        "import",
        path.join(importFixturesDir, "markdown-folder"),
        "--kind",
        "markdown",
        "--out",
        outDir,
        "--pack-id",
        "cli-agent-blocked-import",
        "--agent"
      ],
      output.io
    );
    const json = JSON.parse(output.stdout);

    expect(code).toBe(3);
    expect(json).toMatchObject({
      command: "import",
      status: "blocked",
      ok: false,
      errors: [
        expect.objectContaining({
          code: "mutation.confirmation_required"
        })
      ]
    });
    expect(fs.existsSync(path.join(outDir, "cli-agent-blocked-import"))).toBe(false);
  });

  it("returns 5 for import read failures", async () => {
    const output = createIo();
    const code = await runCli(["import", "does-not-exist", "--out", tempDir()], output.io);

    expect(code).toBe(5);
    expect(output.stderr).toContain("Input path does not exist");
  });

  it("returns 1 for malformed imports and existing output without overwrite", async () => {
    const malformedOutput = createIo();
    const existingOutput = createIo();
    const outDir = tempDir();

    expect(
      await runCli(
        ["import", path.join(importFixturesDir, "malformed-chatgpt"), "--kind", "chatgpt", "--out", outDir],
        malformedOutput.io
      )
    ).toBe(1);
    expect(malformedOutput.stderr).toContain("ChatGPT conversations.json must contain an array");

    expect(
      await runCli(
        ["import", path.join(importFixturesDir, "markdown-folder"), "--kind", "markdown", "--out", outDir, "--pack-id", "exists"],
        existingOutput.io
      )
    ).toBe(0);
    expect(
      await runCli(
        ["import", path.join(importFixturesDir, "markdown-folder"), "--kind", "markdown", "--out", outDir, "--pack-id", "exists"],
        existingOutput.io
      )
    ).toBe(1);
    expect(existingOutput.stderr).toContain("Draft pack already exists");
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

  it("supports render dry-run JSON without writing files", async () => {
    const output = createIo();
    const outDir = tempDir();
    const code = await runCli(
      ["render", path.join(demoPacksDir, "ai-workstation-pack"), "--out", outDir, "--dry-run", "--json"],
      output.io
    );
    const json = JSON.parse(output.stdout);

    expect(code).toBe(0);
    expect(json).toMatchObject({
      schemaVersion: "contextarr.cli-result.v1",
      command: "render",
      ok: true,
      data: {
        dryRun: true,
        packsRendered: 1,
        recordsRendered: 5
      }
    });
    expect(fs.existsSync(path.join(outDir, "index.html"))).toBe(false);
  });

  it("returns 2 for invalid pack render failures", async () => {
    const output = createIo();
    const outDir = tempDir();
    const code = await runCli(["render", fixture("invalid-permissions-pack"), "--out", outDir], output.io);

    expect(code).toBe(2);
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

  it("exports by target alias using the matching existing profile", async () => {
    const output = createIo();
    const outDir = tempDir();
    const code = await runCli(
      ["export", path.join(demoPacksDir, "ai-workstation-pack"), "--target", "claude", "--out", outDir],
      output.io
    );

    expect(code).toBe(0);
    expect(output.stdout).toContain("Exported 1 file(s)");
    expect(fs.readFileSync(path.join(outDir, "ai-workstation-pack", "ai-workstation-claude.md"), "utf8")).toContain(
      "Claude Context Export"
    );
  });

  it("shows --target as an existing-profile alias in export help", async () => {
    const output = createIo();
    const code = await runCli(["export", "--help"], output.io);

    expect(code).toBe(0);
    expect(output.stderr).toBe("");
    expect(output.stdout).toContain("--target <target>");
    expect(output.stdout).toContain("alias for the existing profile matching this target");
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

  it("supports export dry-run JSON without writing files", async () => {
    const output = createIo();
    const outDir = tempDir();
    const code = await runCli(
      [
        "export",
        path.join(demoPacksDir, "ai-workstation-pack"),
        "--profile",
        "ai-workstation-chatgpt",
        "--out",
        outDir,
        "--dry-run",
        "--json"
      ],
      output.io
    );
    const json = JSON.parse(output.stdout);

    expect(code).toBe(0);
    expect(json).toMatchObject({
      schemaVersion: "contextarr.cli-result.v1",
      command: "export",
      ok: true,
      data: {
        dryRun: true,
        counts: {
          files: 1,
          packs: 1
        }
      }
    });
    expect(fs.existsSync(path.join(outDir, "ai-workstation-pack", "ai-workstation-chatgpt.md"))).toBe(false);
  });

  it("supports export target alias dry-run JSON without writing files", async () => {
    const output = createIo();
    const outDir = tempDir();
    const code = await runCli(
      [
        "export",
        path.join(demoPacksDir, "ai-workstation-pack"),
        "--target",
        "codex",
        "--out",
        outDir,
        "--dry-run",
        "--json"
      ],
      output.io
    );
    const json = JSON.parse(output.stdout);

    expect(code).toBe(0);
    expect(json).toMatchObject({
      schemaVersion: "contextarr.cli-result.v1",
      command: "export",
      ok: true,
      data: {
        dryRun: true,
        files: [
          expect.objectContaining({
            profileId: "ai-workstation-codex",
            target: "codex"
          })
        ],
        counts: {
          files: 1,
          packs: 1
        }
      }
    });
    expect(fs.existsSync(path.join(outDir, "ai-workstation-pack", "ai-workstation-codex.md"))).toBe(false);
  });

  it("returns non-zero for invalid export usage and missing profiles", async () => {
    const usageOutput = createIo();
    const missingProfileOutput = createIo();
    const conflictingModesOutput = createIo();
    const unsupportedTargetOutput = createIo();
    const outDir = tempDir();

    expect(await runCli(["export", path.join(demoPacksDir, "ai-workstation-pack"), "--out", outDir], usageOutput.io)).toBe(6);
    expect(usageOutput.stderr).toContain("Choose exactly one export mode");

    expect(
      await runCli(
        ["export", path.join(demoPacksDir, "ai-workstation-pack"), "--profile", "missing-profile", "--out", outDir],
        missingProfileOutput.io
      )
    ).toBe(5);
    expect(missingProfileOutput.stderr).toContain("Export profile not found");

    expect(
      await runCli(
        [
          "export",
          path.join(demoPacksDir, "ai-workstation-pack"),
          "--profile",
          "ai-workstation-chatgpt",
          "--target",
          "chatgpt",
          "--out",
          outDir
        ],
        conflictingModesOutput.io
      )
    ).toBe(6);
    expect(conflictingModesOutput.stderr).toContain("Choose exactly one export mode");

    expect(
      await runCli(
        [
          "export",
          path.join(demoPacksDir, "ai-workstation-pack"),
          "--target",
          "agents-md",
          "--out",
          outDir,
          "--dry-run",
          "--json"
        ],
        unsupportedTargetOutput.io
      )
    ).toBe(10);
    expect(JSON.parse(unsupportedTargetOutput.stdout)).toMatchObject({
      command: "export",
      status: "failed",
      ok: false,
      errors: [
        expect.objectContaining({
          code: "target_profile_not_found"
        })
      ]
    });
  });

  it("blocks export writes in agent mode without --yes", async () => {
    const output = createIo();
    const outDir = tempDir();
    const code = await runCli(
      [
        "export",
        path.join(demoPacksDir, "ai-workstation-pack"),
        "--profile",
        "ai-workstation-chatgpt",
        "--out",
        outDir,
        "--agent"
      ],
      output.io
    );
    const json = JSON.parse(output.stdout);

    expect(code).toBe(3);
    expect(json).toMatchObject({
      command: "export",
      status: "blocked",
      ok: false,
      errors: [
        expect.objectContaining({
          code: "mutation.confirmation_required"
        })
      ]
    });
    expect(fs.existsSync(path.join(outDir, "ai-workstation-pack"))).toBe(false);
  });

  it("inspects a pack through the read-only derived index", async () => {
    const output = createIo();
    const code = await runCli(["inspect", "ai-workstation-pack", "--packs", demoPacksDir, "--json"], output.io);
    const json = JSON.parse(output.stdout);

    expect(code).toBe(0);
    expect(json).toMatchObject({
      command: "inspect",
      ok: true,
      data: {
        pack: {
          id: "ai-workstation-pack"
        },
        records: expect.arrayContaining([
          expect.objectContaining({
            id: "ai-workstation.local-ai-stack"
          })
        ])
      }
    });
  });

  it("lists packs and records through read-only CLI parity commands", async () => {
    const packsOutput = createIo();
    const recordsOutput = createIo();

    expect(await runCli(["list", "packs", "--packs", demoPacksDir, "--json"], packsOutput.io)).toBe(0);
    expect(JSON.parse(packsOutput.stdout)).toMatchObject({
      data: {
        kind: "packs",
        items: expect.arrayContaining([
          expect.objectContaining({
            id: "ai-workstation-pack"
          })
        ])
      }
    });

    expect(await runCli(["list", "records", "--pack", "ai-workstation-pack", "--packs", demoPacksDir, "--json"], recordsOutput.io)).toBe(0);
    expect(JSON.parse(recordsOutput.stdout)).toMatchObject({
      data: {
        kind: "records",
        items: expect.arrayContaining([
          expect.objectContaining({
            id: "ai-workstation.local-ai-stack"
          })
        ])
      }
    });
  });

  it("runs read-only rescan and health checks", async () => {
    const rescanOutput = createIo();
    const healthOutput = createIo();

    expect(await runCli(["rescan", "--packs", demoPacksDir, "--json"], rescanOutput.io)).toBe(0);
    expect(JSON.parse(rescanOutput.stdout)).toMatchObject({
      data: {
        rebuild: {
          packsIndexed: 5,
          recordsIndexed: 25
        }
      }
    });

    expect(await runCli(["health", "ai-workstation-pack", "--packs", demoPacksDir, "--json"], healthOutput.io)).toBe(0);
    expect(JSON.parse(healthOutput.stdout)).toMatchObject({
      data: {
        all: false,
        pack: {
          packId: "ai-workstation-pack"
        }
      }
    });
  });

  it("lists and shows review items without mutating review state", async () => {
    const listOutput = createIo();
    const showOutput = createIo();
    const packsRoot = tempDir();
    fs.cpSync(fixture("missing-manifest-pack"), path.join(packsRoot, "broken-pack"), { recursive: true });

    expect(await runCli(["review", "list", "--packs", packsRoot, "--json"], listOutput.io)).toBe(0);
    const listJson = JSON.parse(listOutput.stdout);
    expect(listJson).toMatchObject({
      data: {
        counts: {
          total: expect.any(Number)
        }
      }
    });

    const firstItemId = listJson.data.items[0]?.id;
    expect(firstItemId).toBeTruthy();

    expect(await runCli(["review", "show", firstItemId, "--packs", packsRoot, "--json"], showOutput.io)).toBe(0);
    expect(JSON.parse(showOutput.stdout)).toMatchObject({
      data: {
        item: {
          id: firstItemId
        }
      }
    });
  });

  it("queries and briefs approved context through the CLI", async () => {
    const queryOutput = createIo();
    const allQueryOutput = createIo();
    const briefOutput = createIo();
    const markdownBriefOutput = createIo();

    expect(
      await runCli(["query", "ai-workstation-pack", "local model", "--packs", demoPacksDir, "--json"], queryOutput.io)
    ).toBe(0);
    expect(JSON.parse(queryOutput.stdout)).toMatchObject({
      data: {
        all: false,
        packId: "ai-workstation-pack",
        results: expect.arrayContaining([
          expect.objectContaining({
            reviewStatus: "approved"
          })
        ])
      }
    });

    expect(await runCli(["query", "--all", "workstation", "--packs", demoPacksDir, "--json"], allQueryOutput.io)).toBe(0);
    expect(JSON.parse(allQueryOutput.stdout)).toMatchObject({
      data: {
        all: true,
        results: expect.arrayContaining([
          expect.objectContaining({
            kind: expect.any(String)
          })
        ])
      }
    });

    expect(
      await runCli(
        ["brief", "ai-workstation-pack", "--task", "Debug local inference setup", "--packs", demoPacksDir, "--agent"],
        briefOutput.io
      )
    ).toBe(0);
    expect(JSON.parse(briefOutput.stdout)).toMatchObject({
      command: "brief",
      ok: true,
      data: {
        pack: {
          id: "ai-workstation-pack"
        },
        records: expect.arrayContaining([
          expect.objectContaining({
            reviewStatus: "approved"
          })
        ])
      }
    });

    expect(
      await runCli(
        ["brief", "ai-workstation-pack", "--task", "Debug local inference setup", "--packs", demoPacksDir, "--markdown"],
        markdownBriefOutput.io
      )
    ).toBe(0);
    expect(markdownBriefOutput.stdout).toContain("# AI Workstation Pack Brief");
    expect(markdownBriefOutput.stdout).toContain("## Records");
  });

  it("runs the G3 benchmark harness in sample-only JSON mode", async () => {
    const output = createIo();
    const code = await runCli(["benchmark", "run", "support-ticket-drafting", "--sample-only", "--json"], output.io);
    const json = JSON.parse(output.stdout);

    expect(code).toBe(0);
    expect(output.stderr).toBe("");
    expect(json).toMatchObject({
      schemaVersion: "contextarr.cli-result.v1",
      command: "benchmark run",
      ok: true,
      data: {
        schemaVersion: "contextarr.benchmark-report.v1",
        taskId: "support-ticket-drafting",
        sampleOnly: true,
        conditions: [
          expect.objectContaining({ id: "no_context" }),
          expect.objectContaining({ id: "manual_prompt" }),
          expect.objectContaining({ id: "raw_notes" }),
          expect.objectContaining({ id: "contextarr_export" })
        ]
      }
    });
  });

  it("writes benchmark reports and blocks agent-mode report writes without --yes", async () => {
    const writeOutput = createIo();
    const blockedOutput = createIo();
    const outDir = tempDir();
    const blockedDir = tempDir();

    expect(await runCli(["benchmark", "report", "contractor-handoff", "--out", outDir], writeOutput.io)).toBe(0);
    expect(fs.existsSync(path.join(outDir, "contractor-handoff.json"))).toBe(true);
    expect(fs.existsSync(path.join(outDir, "contractor-handoff.md"))).toBe(true);

    expect(
      await runCli(["benchmark", "report", "contractor-handoff", "--out", blockedDir, "--agent"], blockedOutput.io)
    ).toBe(3);
    expect(JSON.parse(blockedOutput.stdout)).toMatchObject({
      command: "benchmark report",
      status: "blocked",
      ok: false,
      errors: [
        expect.objectContaining({
          code: "mutation.confirmation_required"
        })
      ]
    });
    expect(fs.existsSync(path.join(blockedDir, "contractor-handoff.json"))).toBe(false);
  });

  it("runs the G4 benchmark gate for all accepted demo fixtures", async () => {
    const output = createIo();
    const code = await runCli(["benchmark", "gate", "--all", "--sample-only", "--json"], output.io);
    const json = JSON.parse(output.stdout);

    expect(code).toBe(0);
    expect(json).toMatchObject({
      schemaVersion: "contextarr.cli-result.v1",
      command: "benchmark gate",
      status: "success",
      ok: true,
      data: {
        schemaVersion: "contextarr.benchmark-gate.v1",
        passed: true,
        summary: {
          tasks: 5,
          passed: 5,
          failed: 0
        }
      }
    });
  });

  it("blocks the G4 benchmark gate when local Contextarr export output fails safety checks", async () => {
    const output = createIo();
    const outputsDir = tempDir();
    const taskDir = path.join(outputsDir, "codex-implementation-brief");
    fs.mkdirSync(taskDir, { recursive: true });
    fs.writeFileSync(path.join(taskDir, "contextarr_export.md"), "token = abcdefghijkl\n", "utf8");

    const code = await runCli(
      ["benchmark", "gate", "codex-implementation-brief", "--outputs", outputsDir, "--json"],
      output.io
    );
    const json = JSON.parse(output.stdout);

    expect(code).toBe(7);
    expect(json).toMatchObject({
      command: "benchmark gate",
      status: "blocked",
      ok: false,
      data: {
        schemaVersion: "contextarr.benchmark-gate.v1",
        passed: false,
        tasks: [
          expect.objectContaining({
            taskId: "codex-implementation-brief",
            passed: false,
            failures: expect.arrayContaining(["sensitive.secret_assignment"])
          })
        ]
      },
      errors: [
        expect.objectContaining({
          code: "benchmark.gate_failed"
        })
      ]
    });
  });

  it("writes G4 gate reports and blocks agent-mode gate writes without --yes", async () => {
    const writeOutput = createIo();
    const blockedOutput = createIo();
    const outDir = tempDir();
    const blockedDir = tempDir();

    expect(await runCli(["benchmark", "gate", "internal-kb-answer", "--out", outDir], writeOutput.io)).toBe(0);
    expect(fs.existsSync(path.join(outDir, "benchmark-gate.json"))).toBe(true);
    expect(fs.existsSync(path.join(outDir, "benchmark-gate.md"))).toBe(true);
    expect(fs.existsSync(path.join(outDir, "internal-kb-answer.json"))).toBe(true);
    expect(fs.existsSync(path.join(outDir, "internal-kb-answer.md"))).toBe(true);

    expect(await runCli(["benchmark", "gate", "--all", "--out", blockedDir, "--agent"], blockedOutput.io)).toBe(3);
    expect(JSON.parse(blockedOutput.stdout)).toMatchObject({
      command: "benchmark gate",
      status: "blocked",
      ok: false,
      errors: [
        expect.objectContaining({
          code: "mutation.confirmation_required"
        })
      ]
    });
    expect(fs.existsSync(path.join(blockedDir, "benchmark-gate.json"))).toBe(false);
  });
});
