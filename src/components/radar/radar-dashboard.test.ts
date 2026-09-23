import { describe, expect, it } from "vitest";
import {
  isRadarMapVisible,
  nextRadarPhaseAfterScan,
  nextRadarPhaseAfterStart,
  radarStartButtonLabel,
} from "./radar-dashboard";

describe("radar dashboard activation", () => {
  it("starts idle and reveals the existing radar after a scan", () => {
    expect(radarStartButtonLabel("idle")).toBe("RADAR STARTEN");
    expect(isRadarMapVisible("idle")).toBe(false);

    const scanning = nextRadarPhaseAfterStart("idle");
    expect(scanning).toBe("scanning");
    expect(radarStartButtonLabel(scanning)).toBe("RADAR AKTIV");
    expect(isRadarMapVisible(scanning)).toBe(true);

    const active = nextRadarPhaseAfterScan(scanning);
    expect(active).toBe("active");
    expect(radarStartButtonLabel(active)).toBe("RADAR AKTIV");
    expect(isRadarMapVisible(active)).toBe(true);
  });

  it("does not restart an already active radar", () => {
    expect(nextRadarPhaseAfterStart("active")).toBe("active");
    expect(nextRadarPhaseAfterScan("active")).toBe("active");
  });
});
