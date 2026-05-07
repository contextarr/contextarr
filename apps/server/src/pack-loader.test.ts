import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadPacks } from "./pack-loader";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const demoPacksDir = path.join(repoRoot, "demo-packs");
const validatorFixturesDir = path.join(repoRoot, "packages/pack-validator/test/fixtures");

describe("loadPacks", () => {
  it("loads all five demo packs", () => {
    const result = loadPacks(demoPacksDir);

    expect(result.skipped).toHaveLength(0);
    expect(result.packs.map((pack) => pack.manifest.id).sort()).toEqual(
      [
        "ai-workstation-pack",
        "jellyfin-server-pack",
        "claude-code-project-pack",
        "internal-support-kb-pack",
        "fake-product-line-pack"
      ].sort()
    );
  });

  it("loads expected demo totals", () => {
    const result = loadPacks(demoPacksDir);

    expect(result.packs.reduce((count, pack) => count + pack.records.length, 0)).toBe(25);
    expect(result.packs.reduce((count, pack) => count + pack.sources.length, 0)).toBe(25);
    expect(result.packs.reduce((count, pack) => count + pack.exportProfiles.length, 0)).toBe(25);
  });

  it("skips invalid packs without failing the whole load", () => {
    const result = loadPacks(validatorFixturesDir);

    expect(result.packs.map((pack) => pack.manifest.id)).toEqual(["valid-minimal-pack"]);
    expect(result.skipped.length).toBeGreaterThan(1);
  });
});
