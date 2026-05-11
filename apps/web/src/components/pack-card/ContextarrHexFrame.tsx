import type { ReactNode } from "react";

export function ContextarrHexFrame({
  accentColor,
  children,
  size = "default",
  className = ""
}: {
  accentColor: string;
  children: ReactNode;
  size?: "default" | "mini";
  className?: string;
}) {
  return (
    <div className={`contextarr-hex-frame contextarr-hex-frame-${size} ${className}`.trim()}>
      <svg viewBox="0 0 96 96" className="contextarr-hex-frame-svg" aria-hidden="true">
        <path
          d="M48 4 L84 24 L84 72 L48 92 L12 72 L12 24 Z"
          fill="rgba(2, 6, 23, 0.42)"
          stroke={accentColor}
          strokeWidth="2"
        />
        <path
          d="M48 16 L74 31 L74 65 L48 80 L22 65 L22 31 Z"
          fill="rgba(15, 23, 42, 0.42)"
          stroke={accentColor}
          strokeOpacity="0.35"
          strokeWidth="1"
        />
      </svg>
      <div className="contextarr-hex-frame-slot">{children}</div>
    </div>
  );
}
