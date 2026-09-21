import { BrandClaim } from "@/components/brand/BrandClaim";

export function LeadgreetSignet({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect x="1.5" y="1.5" width="45" height="45" rx="12" fill="#0b1f33" />
      <rect x="1.5" y="1.5" width="45" height="45" rx="12" stroke="#2ec9b0" strokeOpacity="0.28" />
      <path
        d="M33.5 11.5c3.8 2.6 6.2 7.2 6.2 12.2"
        stroke="#2ec9b0"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M31 8.8c5.4 3.4 8.6 8.8 8.6 15.1"
        stroke="#2ec9b0"
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeOpacity="0.45"
      />
      <g transform="rotate(-16 24 27)">
        <rect x="17.2" y="13.2" width="3.6" height="11.2" rx="1.8" fill="#eef3f7" />
        <rect x="21.4" y="11" width="3.7" height="13.4" rx="1.85" fill="#eef3f7" />
        <rect x="25.7" y="12.4" width="3.6" height="12" rx="1.8" fill="#eef3f7" />
        <rect x="29.8" y="14.6" width="3.3" height="9.6" rx="1.65" fill="#d7e2ea" />
        <rect x="16.6" y="21.4" width="16.8" height="14.2" rx="6.2" fill="#eef3f7" />
        <rect
          x="11.4"
          y="23.6"
          width="8.4"
          height="3.8"
          rx="1.9"
          fill="#eef3f7"
          transform="rotate(-32 15.6 25.5)"
        />
      </g>
    </svg>
  );
}

export function LeadgreetLogo({
  compact = false,
  showClaim = false,
}: {
  compact?: boolean;
  showClaim?: boolean;
}) {
  return (
    <div className={showClaim ? "space-y-4" : undefined}>
      <span className="inline-flex items-center gap-2.5">
        <LeadgreetSignet size={compact ? 28 : 36} />
        <span
          className={`font-semibold tracking-tight ${compact ? "text-[15px]" : "text-base"}`}
        >
          <span className="text-[#9eb4c7]">lead</span>
          <span className="text-accent">greet</span>
        </span>
      </span>
      {showClaim ? <BrandClaim compact /> : null}
    </div>
  );
}
