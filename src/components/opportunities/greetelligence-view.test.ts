import { describe, expect, it } from "vitest";
import { recencyLabel, toSignalRow, toWhyNowView } from "./greetelligence-view";

const now = new Date("2026-09-17T12:00:00.000Z");

const dataPlatform = {
  id: "sig-1",
  type: "DATA_PLATFORM",
  title: "[DEMO] Data platform initiative",
  detectedAt: "2026-09-14T00:00:00.000Z",
  signalStrength: 97,
  sourceName: "[DEMO] Press desk feed",
  sourceUrl: "https://example.com/press",
  sourceType: "PRESS_RELEASE",
};

const processAutomation = {
  id: "sig-2",
  type: "PROCESS_AUTOMATION",
  title: "[DEMO] Process automation assessment",
  detectedAt: "2026-09-07T00:00:00.000Z",
  signalStrength: 71,
  sourceName: "[DEMO] Careers board",
  sourceUrl: null,
  sourceType: "JOB_POSTING",
};

describe("toWhyNowView", () => {
  it("keeps category and concrete signal title separate", () => {
    const view = toWhyNowView({
      signals: [dataPlatform, processAutomation],
      triggerId: "sig-1",
      now,
    });

    expect(view?.category).toBe("Datenplattform");
    expect(view?.title).toBe("[DEMO] Data platform initiative");
    expect(view?.age).toBe("vor 3 Tagen");
    expect(view?.strength).toBe(97);
    expect(view?.interpretation).toBe(
      "Das aktuelle Signal deutet auf ein konkretes Vorhaben im Bereich Datenplattform hin.",
    );
    expect(view?.interpretation).not.toContain("[DEMO] Data platform initiative");
    expect(view?.interpretation).not.toBe("Das Signal weist auf eine aktuelle Datenplattform hin.");
  });

  it("shows the stored source type, name and url without inventing a source", () => {
    const view = toWhyNowView({
      signals: [dataPlatform],
      triggerId: "sig-1",
      now,
    });

    expect(view?.source).toMatchObject({
      typeLabel: "Pressemitteilung",
      name: "[DEMO] Press desk feed",
      url: "https://example.com/press",
      missing: false,
    });
    expect(view?.source.date).toBe("14.09.2026");
  });

  it("does not invent a source when none is stored", () => {
    const view = toWhyNowView({
      signals: [
        {
          id: "sig-3",
          type: "DATA_PLATFORM",
          title: "[DEMO] Data platform initiative",
          detectedAt: "2026-09-14T00:00:00.000Z",
          signalStrength: 84,
          sourceName: null,
          sourceUrl: null,
          sourceType: null,
        },
      ],
      now,
    });

    expect(view?.source.missing).toBe(true);
    expect(view?.source.typeLabel).toBeNull();
    expect(view?.source.name).toBeNull();
    expect(view?.source.url).toBeNull();
  });

  it("keeps additional supporting signals compact", () => {
    const view = toWhyNowView({
      signals: [dataPlatform, processAutomation],
      triggerId: "sig-1",
      now,
    });

    expect(view?.supporting).toHaveLength(1);
    expect(view?.supporting[0]).toMatchObject({
      id: "sig-2",
      title: "[DEMO] Process automation assessment",
      category: "Prozessautomatisierung",
      strength: 71,
    });
  });

  it("returns null when no signal is present", () => {
    expect(toWhyNowView({ signals: [] })).toBeNull();
  });
});

describe("toSignalRow", () => {
  it("shows type, age and strength for the signal list", () => {
    expect(
      toSignalRow({
        id: "sig-1",
        type: "PROCESS_AUTOMATION",
        title: "[DEMO] Process automation assessment",
        detectedAt: "2026-09-07T00:00:00.000Z",
        signalStrength: 71,
        now,
      }),
    ).toEqual({
      id: "sig-1",
      name: "Prozessautomatisierung",
      age: "10 Tage",
      strength: 71,
    });
  });
});

describe("recencyLabel", () => {
  it("uses a short relative age", () => {
    expect(recencyLabel(0)).toBe("Heute");
    expect(recencyLabel(1)).toBe("vor 1 Tag");
    expect(recencyLabel(4)).toBe("vor 4 Tagen");
  });
});
