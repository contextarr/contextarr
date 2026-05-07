import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runCli } from "./index";

const fixturesDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../packages/pack-validator/test/fixtures"
);

function fixture(name: string): string {
  return path.join(fixturesDir, name);
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

  it("returns 2 for usage or read failures", async () => {
    const output = createIo();
    const code = await runCli(["validate", "does-not-exist"], output.io);

    expect(code).toBe(2);
    expect(output.stderr).toContain("Pack path is not a readable directory");
  });
});
