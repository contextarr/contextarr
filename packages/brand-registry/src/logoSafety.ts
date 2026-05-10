import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { brands } from "./brands";

export interface LogoSafetyIssue {
  brandId: string;
  file: string;
  code:
    | "logo.missing"
    | "logo.script"
    | "logo.foreign_object"
    | "logo.external_href"
    | "logo.remote_image"
    | "logo.javascript_href";
  message: string;
}

export const brandAssetsDir = path.resolve(fileURLToPath(new URL("../assets", import.meta.url)));

export function validateRegisteredBrandLogos(assetsDir = brandAssetsDir): LogoSafetyIssue[] {
  const issues: LogoSafetyIssue[] = [];

  for (const brand of brands) {
    const logoFile = path.join(assetsDir, `${brand.id}.svg`);
    if (!fs.existsSync(logoFile)) {
      issues.push({
        brandId: brand.id,
        file: logoFile,
        code: "logo.missing",
        message: `Missing registered logo asset for ${brand.id}.`
      });
      continue;
    }

    const svg = fs.readFileSync(logoFile, "utf8");
    issues.push(...validateSvgLogo(brand.id, logoFile, svg));
  }

  return issues;
}

export function validateSvgLogo(brandId: string, file: string, svg: string): LogoSafetyIssue[] {
  const issues: LogoSafetyIssue[] = [];
  const lower = svg.toLowerCase();

  if (/<\s*script\b/i.test(svg)) {
    issues.push(issue(brandId, file, "logo.script", "SVG logo must not include script tags."));
  }

  if (/<\s*foreignobject\b/i.test(svg)) {
    issues.push(issue(brandId, file, "logo.foreign_object", "SVG logo must not include foreignObject."));
  }

  if (/\b(?:href|xlink:href)\s*=\s*["']\s*javascript:/i.test(svg) || lower.includes("javascript:")) {
    issues.push(issue(brandId, file, "logo.javascript_href", "SVG logo must not include javascript: references."));
  }

  if (/\b(?:href|xlink:href)\s*=\s*["']\s*(?:https?:)?\/\//i.test(svg)) {
    issues.push(issue(brandId, file, "logo.external_href", "SVG logo must not include external href references."));
  }

  if (/<\s*image\b[^>]*\b(?:href|xlink:href)\s*=\s*["']\s*(?:https?:)?\/\//i.test(svg)) {
    issues.push(issue(brandId, file, "logo.remote_image", "SVG logo must not embed remote images."));
  }

  return issues;
}

function issue(
  brandId: string,
  file: string,
  code: LogoSafetyIssue["code"],
  message: string
): LogoSafetyIssue {
  return { brandId, file, code, message };
}
