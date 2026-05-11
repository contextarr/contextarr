import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import * as simpleIcons from "simple-icons";

const outputDir = path.resolve(fileURLToPath(new URL("../assets", import.meta.url)));
const require = createRequire(import.meta.url);
const deviconRoot = path.dirname(require.resolve("devicon/package.json"));

const iconMap = [
  ["openai", "siOpenai"],
  ["claude", "siClaude"],
  ["google", "siGoogle"],
  ["jellyfin", "siJellyfin"],
  ["docker", "siDocker"],
  ["unifi", "siUbiquiti"],
  ["github", "siGithub"],
  ["homeassistant", "siHomeassistant"],
  ["tailscale", "siTailscale"],
  ["obsidian", "siObsidian"]
];

const deviconAssets = [
  ["aws", "icons/amazonwebservices/amazonwebservices-original-wordmark.svg"],
  ["vscode", "icons/vscode/vscode-original.svg"]
];

fs.mkdirSync(outputDir, { recursive: true });

for (const [brandId, exportName] of iconMap) {
  const icon = simpleIcons[exportName];
  if (!icon) {
    throw new Error(`Missing simple-icons export: ${exportName}`);
  }

  const svg = [
    `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">`,
    `<title>${escapeXml(icon.title)}</title>`,
    `<path fill="#${icon.hex}" d="${icon.path}"/>`,
    `</svg>`,
    ""
  ].join("\n");

  fs.writeFileSync(path.join(outputDir, `${brandId}.svg`), svg, "utf8");
}

for (const [brandId, relativeAssetPath] of deviconAssets) {
  const svg = fs.readFileSync(path.join(deviconRoot, relativeAssetPath), "utf8");
  fs.writeFileSync(path.join(outputDir, `${brandId}.svg`), svg.endsWith("\n") ? svg : `${svg}\n`, "utf8");
}

function escapeXml(value) {
  return value.replace(/[<>&"']/g, (char) => {
    switch (char) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case '"':
        return "&quot;";
      default:
        return "&apos;";
    }
  });
}
