import { HeartPulse } from "lucide-react";

export function PackHealthPill({ score, status }: { score: number; status: string }) {
  return (
    <span className={`pack-card-health is-${status}`} aria-label={`Health ${score} percent`}>
      <HeartPulse size={14} aria-hidden="true" />
      {score}%
    </span>
  );
}
