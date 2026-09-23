import type { RadarScopeDot } from "./radar-scope";
import type { RadarDashboardPhase } from "./radar-dashboard";

export function RadarScope({
  dots,
  phase,
}: {
  dots: RadarScopeDot[];
  phase: RadarDashboardPhase;
}) {
  const sweeping = phase === "scanning";
  const revealed = phase !== "idle";

  return (
    <svg
      viewBox="0 0 200 200"
      className="h-full w-full"
      role="img"
      aria-label="Radar mit bekannten Unternehmen"
    >
      <defs>
        <radialGradient id="radar-scope-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2ec9b0" stopOpacity="0.12" />
          <stop offset="70%" stopColor="#2ec9b0" stopOpacity="0.03" />
          <stop offset="100%" stopColor="#0c1319" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="radar-scope-sweep" x1="50%" y1="0%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#2ec9b0" stopOpacity="0" />
          <stop offset="55%" stopColor="#2ec9b0" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#2ec9b0" stopOpacity="0.28" />
        </linearGradient>
      </defs>

      <circle cx="100" cy="100" r="98" fill="#0c1319" />
      <circle cx="100" cy="100" r="98" fill="url(#radar-scope-glow)" />
      <circle cx="100" cy="100" r="96" fill="none" stroke="#2a3c4b" strokeWidth="1" />
      <circle cx="100" cy="100" r="72" fill="none" stroke="#2a3c4b" strokeWidth="0.8" />
      <circle cx="100" cy="100" r="48" fill="none" stroke="#2a3c4b" strokeWidth="0.8" />
      <circle cx="100" cy="100" r="24" fill="none" stroke="#2a3c4b" strokeWidth="0.8" />
      <line x1="100" y1="4" x2="100" y2="196" stroke="#2a3c4b" strokeWidth="0.7" />
      <line x1="4" y1="100" x2="196" y2="100" stroke="#2a3c4b" strokeWidth="0.7" />

      <g
        className={sweeping ? "radar-scope-sweep-run" : undefined}
        style={{ transformOrigin: "100px 100px" }}
      >
        <path d="M100 100 L100 8 A92 92 0 0 1 178 64 Z" fill="url(#radar-scope-sweep)" />
        <line x1="100" y1="100" x2="100" y2="8" stroke="#2ec9b0" strokeWidth="1.2" />
      </g>

      {dots.map((dot) => (
        <circle
          key={dot.id}
          cx={dot.x}
          cy={dot.y}
          r={dot.greet >= 75 ? 3.2 : 2.4}
          fill="#2ec9b0"
          opacity={revealed ? 0.95 : 0.42}
        >
          <title>{`${dot.name}, Greet ${dot.greet}`}</title>
        </circle>
      ))}
    </svg>
  );
}
