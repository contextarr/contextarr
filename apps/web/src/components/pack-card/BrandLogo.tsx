import type { BrandRegistryItem } from "@contextarr/brand-registry";
import awsLogo from "../../../../../packages/brand-registry/assets/aws.svg?url";
import claudeLogo from "../../../../../packages/brand-registry/assets/claude.svg?url";
import dockerLogo from "../../../../../packages/brand-registry/assets/docker.svg?url";
import githubLogo from "../../../../../packages/brand-registry/assets/github.svg?url";
import googleLogo from "../../../../../packages/brand-registry/assets/google.svg?url";
import homeAssistantLogo from "../../../../../packages/brand-registry/assets/homeassistant.svg?url";
import jellyfinLogo from "../../../../../packages/brand-registry/assets/jellyfin.svg?url";
import obsidianLogo from "../../../../../packages/brand-registry/assets/obsidian.svg?url";
import openaiLogo from "../../../../../packages/brand-registry/assets/openai.svg?url";
import tailscaleLogo from "../../../../../packages/brand-registry/assets/tailscale.svg?url";
import unifiLogo from "../../../../../packages/brand-registry/assets/unifi.svg?url";
import vscodeLogo from "../../../../../packages/brand-registry/assets/vscode.svg?url";

const brandLogoUrls: Record<string, string> = {
  openai: openaiLogo,
  claude: claudeLogo,
  google: googleLogo,
  aws: awsLogo,
  jellyfin: jellyfinLogo,
  docker: dockerLogo,
  unifi: unifiLogo,
  vscode: vscodeLogo,
  github: githubLogo,
  homeassistant: homeAssistantLogo,
  tailscale: tailscaleLogo,
  obsidian: obsidianLogo
};

export function BrandLogo({
  brand,
  className = "brand-logo"
}: {
  brand: BrandRegistryItem;
  className?: string;
}) {
  return (
    <img
      src={getBrandLogoSrc(brand)}
      alt={`${brand.name} logo`}
      className={className}
      loading="lazy"
      draggable={false}
    />
  );
}

export function getBrandLogoSrc(brand: BrandRegistryItem): string {
  return brandLogoUrls[brand.id] ?? brand.logoPath;
}
