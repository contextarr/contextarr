import type { BrandRegistryItem } from "./brandSchema";
import { brands, brandsById } from "./brands";

export interface BrandResolvablePack {
  name: string;
  description?: string | null;
  assets?: {
    brandId?: string | null;
  } | null;
}

export function resolveBrandForPack(pack: BrandResolvablePack): BrandRegistryItem | null {
  const explicitBrandId = normalizeId(pack.assets?.brandId);
  if (explicitBrandId) {
    return brandsById.get(explicitBrandId) ?? null;
  }

  return findBrandByText(pack.name) ?? findBrandByText(pack.description ?? "") ?? null;
}

export function findBrandByText(value: string): BrandRegistryItem | null {
  const normalizedText = normalizeText(value);
  if (!normalizedText) {
    return null;
  }

  for (const brand of brands) {
    if (brand.aliases.some((alias) => textContainsAlias(normalizedText, alias))) {
      return brand;
    }
  }

  return null;
}

function textContainsAlias(normalizedText: string, alias: string): boolean {
  const normalizedAlias = normalizeText(alias);
  if (!normalizedAlias) {
    return false;
  }

  const escaped = normalizedAlias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(normalizedText);
}

function normalizeId(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
