import { resolveBrandForPack, type BrandRegistryItem } from "@contextarr/brand-registry";
import type { CSSProperties } from "react";
import type { PackSummary } from "../../types";

export const packCardTokens = {
  card: {
    width: 260,
    minHeight: 286,
    radius: 14,
    border: "rgba(148, 163, 184, 0.18)",
    background: "#07111f"
  },
  cover: {
    height: 132,
    meshOpacity: 0.18,
    glowOpacity: 0.32
  },
  logo: {
    frameSize: 80,
    logoMaxSize: 48
  }
} as const;

export type PackTrustDisplay = "curated" | "verified" | "community" | "local" | "imported" | "unreviewed" | "blocked";

export const packTrustLabels: Record<PackTrustDisplay, string> = {
  curated: "Curated",
  verified: "Verified",
  community: "Community",
  local: "Local",
  imported: "Imported",
  unreviewed: "Unreviewed",
  blocked: "Blocked"
};

const fallbackGradients: Array<[string, string]> = [
  ["#063B32", "#07111F"],
  ["#0A3357", "#07111F"],
  ["#2C255E", "#07111F"],
  ["#3A2012", "#07111F"],
  ["#123342", "#07111F"],
  ["#23304A", "#07111F"]
];

export function resolvePackBrand(pack: PackSummary): BrandRegistryItem | null {
  return resolveBrandForPack({
    name: pack.name,
    description: pack.description,
    assets: {
      brandId: pack.brandId ?? undefined
    }
  });
}

export function normalizePackTrustLevel(value: string, hasThirdPartyBrand = false): PackTrustDisplay {
  const normalized = value.trim().toLowerCase();

  if (normalized === "official") {
    return hasThirdPartyBrand ? "curated" : "curated";
  }

  if (normalized === "deprecated") {
    return "blocked";
  }

  if (
    normalized === "curated" ||
    normalized === "verified" ||
    normalized === "community" ||
    normalized === "local" ||
    normalized === "imported" ||
    normalized === "unreviewed" ||
    normalized === "blocked"
  ) {
    return normalized;
  }

  return "unreviewed";
}

export function getPackCoverRecipe(pack: PackSummary, brand: BrandRegistryItem | null): "brand_hex_v1" | "generated_v1" {
  return pack.coverRecipe === "brand_hex_v1" || pack.coverRecipe === "generated_v1"
    ? pack.coverRecipe
    : brand
      ? "brand_hex_v1"
      : "generated_v1";
}

export function getGeneratedGradient(pack: Pick<PackSummary, "id" | "name" | "type">): [string, string] {
  return fallbackGradients[hashString(`${pack.id}:${pack.name}:${pack.type}`) % fallbackGradients.length];
}

export function getCoverStyle(pack: PackSummary, brand: BrandRegistryItem | null): CSSProperties {
  const gradient = brand?.cardGradient ?? getGeneratedGradient(pack);
  const accent = brand?.accentColor ?? sanitizeAccentColor(pack.accentColor) ?? "#2563EB";

  return {
    "--pack-card-accent": accent,
    background: `
      radial-gradient(circle at 50% 42%, ${accent}44 0%, transparent 38%),
      linear-gradient(135deg, ${gradient[0]} 0%, ${gradient[1]} 100%)
    `
  } as CSSProperties;
}

export function sanitizeAccentColor(value: string | null | undefined): string | null {
  return value && /^#[0-9A-Fa-f]{6}$/.test(value) ? value : null;
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}
