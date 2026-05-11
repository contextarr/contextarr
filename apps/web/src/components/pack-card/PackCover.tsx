import { BookOpen, Box, Code2, Database, Package, Server } from "lucide-react";
import type { PackSummary } from "../../types";
import { BrandLogo } from "./BrandLogo";
import { ContextarrHexFrame } from "./ContextarrHexFrame";
import { getCoverStyle, getPackCoverRecipe, resolvePackBrand, sanitizeAccentColor } from "./packCardTokens";

const categoryIcons = {
  book: BookOpen,
  box: Box,
  code: Code2,
  database: Database,
  package: Package,
  server: Server
};

export function PackCover({
  pack,
  variant = "card"
}: {
  pack: PackSummary;
  variant?: "card" | "compact" | "mini";
}) {
  const brand = resolvePackBrand(pack);
  const recipe = getPackCoverRecipe(pack, brand);
  const accentColor = brand?.accentColor ?? sanitizeAccentColor(pack.accentColor) ?? "#2563EB";
  const coverImage = sanitizeLocalCoverImage(pack.coverImage);
  const Icon = categoryIcons[iconForPack(pack)];

  return (
    <div
      className={`brand-pack-cover brand-pack-cover-${variant} recipe-${recipe}`}
      style={getCoverStyle(pack, brand)}
      aria-label={`${pack.name} generated cover`}
    >
      <div className="brand-pack-cover-mesh" aria-hidden="true" />
      {coverImage ? (
        <img className="brand-pack-cover-image" src={coverImage} alt="" />
      ) : (
        <ContextarrHexFrame accentColor={accentColor} size={variant === "mini" ? "mini" : "default"}>
          {brand ? (
            <BrandLogo brand={brand} className={variant === "mini" ? "brand-logo brand-logo-mini" : "brand-logo"} />
          ) : (
            <Icon className="brand-pack-cover-fallback-icon" size={variant === "mini" ? 16 : 34} aria-hidden="true" />
          )}
        </ContextarrHexFrame>
      )}
    </div>
  );
}

function iconForPack(pack: PackSummary): keyof typeof categoryIcons {
  const text = `${pack.type} ${pack.name}`.toLowerCase();

  if (text.includes("server") || text.includes("infra")) {
    return "server";
  }

  if (text.includes("code") || text.includes("dev") || text.includes("project")) {
    return "code";
  }

  if (text.includes("kb") || text.includes("knowledge") || text.includes("docs")) {
    return "book";
  }

  if (text.includes("data") || text.includes("source")) {
    return "database";
  }

  if (text.includes("product")) {
    return "box";
  }

  return "package";
}

function sanitizeLocalCoverImage(value: string | null | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }

  const normalized = value.trim().replace(/\\/g, "/");
  if (
    /^[A-Za-z][A-Za-z0-9+.-]*:/i.test(normalized) ||
    /^[A-Za-z]:\//.test(normalized) ||
    normalized.startsWith("/") ||
    normalized.startsWith("//") ||
    normalized.startsWith("../") ||
    normalized === ".." ||
    /[\u0000-\u001F"'<>]/.test(normalized)
  ) {
    return null;
  }

  return normalized;
}
