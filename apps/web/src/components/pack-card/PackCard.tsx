import { CalendarDays } from "lucide-react";
import type { PackSummary } from "../../types";
import { formatPackType } from "../../library";
import { packHref } from "../../routes";
import { PackCardMenu } from "./PackCardMenu";
import { PackCover } from "./PackCover";
import { PackHealthPill } from "./PackHealthPill";
import { PackTrustBadge } from "./PackTrustBadge";
import { resolvePackBrand } from "./packCardTokens";

export function PackCard({ pack }: { pack: PackSummary }) {
  const brand = resolvePackBrand(pack);
  const href = packHref(pack.id);

  return (
    <article className="brand-pack-card">
      <a href={href} aria-label={`Open ${pack.name}`}>
        <PackCover pack={pack} />
      </a>
      <div className="brand-pack-card-body">
        <h2>
          <a className="pack-title-link" href={href}>
            {pack.name}
          </a>
        </h2>
        <span className="pack-type">{formatPackType(pack.type)}</span>
        <div className="brand-pack-card-meta">
          <PackHealthPill score={pack.healthScore} status={pack.healthStatus} />
          <PackTrustBadge trustLevel={pack.trustLevel} hasThirdPartyBrand={Boolean(brand)} />
        </div>
        <div className="brand-pack-card-footer">
          <span>
            <CalendarDays size={14} aria-hidden="true" />
            {formatDate(pack.lastReviewedAt)}
          </span>
          <PackCardMenu href={href} packName={pack.name} />
        </div>
      </div>
    </article>
  );
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Not reviewed";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(value));
}
