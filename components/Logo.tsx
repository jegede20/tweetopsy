import Link from "next/link";
import { useId } from "react";

interface LogoProps {
  reversed?: boolean;
  compact?: boolean;
}

export function LogoMark({ reversed = false, size = 36 }: { reversed?: boolean; size?: number }) {
  const reactId = useId().replace(/:/g, "");
  const clipId = `tweetopsy-logo-clip-${reactId}`;
  return (
    <svg className={`logo-mark${reversed ? " logo-mark-reversed" : ""}`} width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Tweetopsy mark">
      <defs>
        <clipPath id={clipId}><rect width="120" height="120" rx="28" /></clipPath>
      </defs>
      <rect className="logo-square" width="120" height="120" rx="28" />
      <g clipPath={`url(#${clipId})`}>
        <rect className="logo-bar" x="24" y="30" width="72" height="10" rx="5" />
        <rect className="logo-bar" x="24" y="55" width="58" height="10" rx="5" />
        <rect className="logo-bar" x="24" y="80" width="40" height="10" rx="5" />
        <path className="logo-cut" d="M96 -6 L24 126" strokeWidth="12" strokeLinecap="round" />
        <path d="M96 -6 L24 126" stroke="#F2A20C" strokeWidth="4.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function Logo({ reversed = false, compact = false }: LogoProps) {
  return (
    <Link className={`brand-lockup${compact ? " brand-compact" : ""}${reversed ? " brand-reversed" : ""}`} href="/" aria-label="Tweetopsy home">
      <LogoMark reversed={reversed} size={compact ? 30 : 38} />
      {!compact && <span className="logo-wordmark">Tweetopsy</span>}
    </Link>
  );
}
