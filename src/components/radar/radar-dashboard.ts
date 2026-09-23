export type RadarDashboardPhase = "idle" | "scanning" | "active";

export function radarStartButtonLabel(phase: RadarDashboardPhase): string {
  return phase === "idle" ? "RADAR STARTEN" : "RADAR AKTIV";
}

export function isRadarMapVisible(phase: RadarDashboardPhase): boolean {
  return phase !== "idle";
}

export function nextRadarPhaseAfterStart(phase: RadarDashboardPhase): RadarDashboardPhase {
  return phase === "idle" ? "scanning" : phase;
}

export function nextRadarPhaseAfterScan(phase: RadarDashboardPhase): RadarDashboardPhase {
  return phase === "scanning" ? "active" : phase;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
