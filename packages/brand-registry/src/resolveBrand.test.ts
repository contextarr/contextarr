import { describe, expect, it } from "vitest";
import { brands } from "./brands";
import { resolveBrandForPack } from "./resolveBrand";

describe("resolveBrandForPack", () => {
  it("resolves explicit brandId before text aliases", () => {
    expect(
      resolveBrandForPack({
        name: "AWS Infrastructure Pack",
        description: "Claude deployment notes.",
        assets: { brandId: "openai" }
      })?.id
    ).toBe("openai");
  });

  it("resolves aliases from pack names and descriptions deterministically", () => {
    expect(resolveBrandForPack({ name: "Claude Code Project Pack" })?.id).toBe("claude");
    expect(resolveBrandForPack({ name: "Private Homelab", description: "Media server notes for Jellyfin." })?.id).toBe(
      "jellyfin"
    );
  });

  it("returns null for missing or unknown brands", () => {
    expect(resolveBrandForPack({ name: "Generic Local Pack" })).toBeNull();
    expect(resolveBrandForPack({ name: "OpenAI Pack", assets: { brandId: "not-registered" } })).toBeNull();
  });

  it("registers the 12 starter brands", () => {
    expect(brands.map((brand) => brand.id)).toEqual([
      "openai",
      "claude",
      "google",
      "aws",
      "jellyfin",
      "docker",
      "unifi",
      "vscode",
      "github",
      "homeassistant",
      "tailscale",
      "obsidian"
    ]);
  });
});
