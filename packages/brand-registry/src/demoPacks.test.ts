import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { resolveBrandForPack } from "./resolveBrand";

const demoBrandPacks = [
  ["openai-prompt-engineering-pack", "openai"],
  ["claude-code-project-pack", "claude"],
  ["google-workspace-pack", "google"],
  ["aws-infrastructure-pack", "aws"],
  ["jellyfin-media-server-pack", "jellyfin"],
  ["docker-containers-pack", "docker"],
  ["unifi-network-pack", "unifi"],
  ["vscode-setup-pack", "vscode"],
  ["github-workflow-pack", "github"],
  ["home-assistant-pack", "homeassistant"],
  ["tailscale-vpn-pack", "tailscale"],
  ["obsidian-vault-pack", "obsidian"]
] as const;

const repoRoot = path.resolve(fileURLToPath(new URL("../../..", import.meta.url)));

describe("demo pack brand metadata", () => {
  it("resolves every mockup demo pack brandId", () => {
    for (const [packId, brandId] of demoBrandPacks) {
      const manifest = readDemoManifest(packId);
      expect(manifest.assets?.brandId).toBe(brandId);
      expect(manifest.assets?.coverRecipe).toBe("brand_hex_v1");
      expect(resolveBrandForPack(manifest)?.id).toBe(brandId);
    }
  });
});

function readDemoManifest(packId: string): { name: string; description?: string; assets?: { brandId?: string; coverRecipe?: string } } {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, "demo-packs", packId, "contextarr-pack.json"), "utf8"));
}
