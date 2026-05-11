import { ShieldAlert, ShieldCheck } from "lucide-react";
import { normalizePackTrustLevel, packTrustLabels } from "./packCardTokens";

export function PackTrustBadge({
  trustLevel,
  hasThirdPartyBrand = false
}: {
  trustLevel: string;
  hasThirdPartyBrand?: boolean;
}) {
  const normalized = normalizePackTrustLevel(trustLevel, hasThirdPartyBrand);
  const Icon = normalized === "blocked" ? ShieldAlert : ShieldCheck;

  return (
    <span className={`pack-card-trust is-${normalized}`} aria-label={`Trust ${packTrustLabels[normalized]}`}>
      <Icon size={14} aria-hidden="true" />
      {packTrustLabels[normalized]}
    </span>
  );
}
