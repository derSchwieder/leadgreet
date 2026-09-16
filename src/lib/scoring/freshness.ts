import {
  clampScore,
  daysBetween,
  type ComponentScoreResult,
  type ScoringSignalInput,
} from "./types";

function freshnessFromAge(ageDays: number): { score: number; label: string } {
  if (ageDays <= 7) {
    return { score: 100, label: "Signal is less than 7 days old" };
  }
  if (ageDays <= 14) {
    return { score: 95, label: "Signal is less than 14 days old" };
  }
  if (ageDays <= 30) {
    return { score: 90, label: "Signal is less than 30 days old" };
  }
  if (ageDays <= 60) {
    return { score: 70, label: "Signal is 30–60 days old" };
  }
  if (ageDays <= 90) {
    return { score: 50, label: "Signal is 60–90 days old" };
  }
  if (ageDays <= 180) {
    return { score: 30, label: "Signal is 90–180 days old" };
  }
  return { score: 10, label: "Signal is older than 180 days" };
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
          label: "No signal date",
          points: 0,
          detail: "Freshness cannot be scored without a signal.",
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
        label: "Signal age",
        points: score,
        detail: `${label} (${youngest} day${youngest === 1 ? "" : "s"}).`,
      },
    ],
  };
}
