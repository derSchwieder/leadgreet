import {
  clampScore,
  daysBetween,
  type ComponentScoreResult,
  type ScoringSignalInput,
} from "./types";

function freshnessFromAge(ageDays: number): { score: number; label: string } {
  if (ageDays <= 7) {
    return { score: 100, label: "Das Signal ist weniger als 7 Tage alt" };
  }
  if (ageDays <= 14) {
    return { score: 95, label: "Das Signal ist weniger als 14 Tage alt" };
  }
  if (ageDays <= 30) {
    return { score: 90, label: "Das Signal ist weniger als 30 Tage alt" };
  }
  if (ageDays <= 60) {
    return { score: 70, label: "Das Signal ist 30–60 Tage alt" };
  }
  if (ageDays <= 90) {
    return { score: 50, label: "Das Signal ist 60–90 Tage alt" };
  }
  if (ageDays <= 180) {
    return { score: 30, label: "Das Signal ist 90–180 Tage alt" };
  }
  return { score: 10, label: "Das Signal ist älter als 180 Tage" };
}

export function signalAgeDays(signal: ScoringSignalInput, now: Date): number {
  const reference = signal.eventDate ?? signal.detectedAt;
  return daysBetween(reference, now);
}

export function scoreFreshness(
  signals: ScoringSignalInput[],
  now: Date = new Date(),
): ComponentScoreResult {
  if (signals.length === 0) {
    return {
      score: 0,
      factors: [
        {
          code: "no_date",
          label: "Kein Signaldatum",
          points: 0,
          detail: "Die Aktualität kann ohne Signal nicht bewertet werden.",
        },
      ],
    };
  }

  const ages = signals.map((signal) => signalAgeDays(signal, now));
  const youngest = Math.min(...ages);
  const { score, label } = freshnessFromAge(youngest);

  return {
    score: clampScore(score),
    factors: [
      {
        code: "age",
        label,
        points: score,
        detail: `Das Signal ist ${youngest} ${youngest === 1 ? "Tag" : "Tage"} alt.`,
      },
    ],
  };
}
