import { ExternalLink, MoreVertical, ShieldCheck } from "lucide-react";

export function PackCardMenu({ href, packName, compact = false }: { href: string; packName: string; compact?: boolean }) {
  return (
    <details className={compact ? "pack-card-menu is-compact" : "pack-card-menu"}>
      <summary aria-label={`Open quick actions for ${packName}`}>
        <MoreVertical size={17} aria-hidden="true" />
      </summary>
      <div className="pack-card-menu-popover" role="menu">
        <a href={href} role="menuitem">
          <ExternalLink size={14} aria-hidden="true" />
          Open
        </a>
        <button type="button" role="menuitem" disabled>
          <ShieldCheck size={14} aria-hidden="true" />
          Review
        </button>
      </div>
    </details>
  );
}
