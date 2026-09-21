import {
  CONTACT_ROLE_LABELS,
  SIGNAL_TYPE_LABELS,
  SOURCE_TYPE_LABELS,
} from "@/lib/labels";

const EXACT_REPLACEMENTS: Array<[string, string]> = [
  [
    "Demo playbook: confirm the signal with the listed contact, qualify budget owner, and decide whether to open a discovery conversation. This text is generated, not company-specific advice based on real events.",
    "Demo-Leitfaden: Prüfen Sie das aktuelle Signal mit dem hinterlegten Kontakt, klären Sie Timing und Budgetverantwortliche und entscheiden Sie, ob ein Erstgespräch sinnvoll ist. Dieser Text ist ein Beispiel und keine unternehmensspezifische Beratung.",
  ],
  [
    "Review the current signal with the identified contact. Confirm timing, budget owner, and whether an external partner is already engaged.",
    "Prüfen Sie das aktuelle Signal mit dem hinterlegten Kontakt. Klären Sie Timing und Budgetverantwortliche und ob bereits ein externer Partner eingebunden ist.",
  ],
  [
    "The triggering signal is current (under 30 days).",
    "Das auslösende Signal ist aktuell (unter 30 Tagen).",
  ],
  [
    "The signal is still recent enough to act this quarter.",
    "Das Signal ist noch aktuell genug, um in diesem Quartal zu handeln.",
  ],
  [
    "The signal is aging — outreach should happen now or the window closes.",
    "Das Signal altert — die Ansprache sollte jetzt erfolgen, sonst schließt sich das Zeitfenster.",
  ],
  ["A named contact exists for this account.", "Für diesen Account ist ein Ansprechpartner hinterlegt."],
  [
    "Opportunity can still be worked, but outreach target is missing.",
    "Die Chance kann weiterbearbeitet werden, aber es fehlt ein Ansprechpartner.",
  ],
  ["Email or LinkedIn is on file.", "E-Mail oder LinkedIn ist hinterlegt."],
  [
    "Start at 40 when the company is on the radar without a full profile.",
    "Startwert 40, wenn das Unternehmen ohne vollständiges Profil im Radar ist.",
  ],
  [
    "Industry matches the leadgreet target profile (industrial / tech-adjacent).",
    "Die Branche entspricht dem Leadgreet-Zielprofil (Industrie / technologieaffin).",
  ],
  [
    "No industry on file — profile has not been enriched yet.",
    "Keine Branche hinterlegt — das Profil ist noch nicht angereichert.",
  ],
  ["Country is in the DACH focus region.", "Das Land liegt in der DACH-Fokusregion."],
  ["No country on file.", "Kein Land hinterlegt."],
  [
    "A company website is available for further research.",
    "Eine Unternehmenswebsite steht für die weitere Recherche zur Verfügung.",
  ],
  ["Revenue data improves account qualification.", "Umsatzdaten verbessern die Account-Qualifizierung."],
  [
    "Company fit is limited because only the company name is known.",
    "Der Unternehmens-Fit ist begrenzt, weil nur der Firmenname bekannt ist.",
  ],
  [
    "Start from a conservative baseline until evidence accumulates.",
    "Konservativer Startwert, bis sich weitere Belege ansammeln.",
  ],
  [
    "A signal exists but source credibility is unknown.",
    "Ein Signal liegt vor, die Glaubwürdigkeit der Quelle ist aber unbekannt.",
  ],
  [
    "At least one signal has a source URL that can be reviewed.",
    "Mindestens ein Signal hat eine überprüfbare Quellen-URL.",
  ],
  ["Core company fields are populated.", "Die zentralen Unternehmensfelder sind hinterlegt."],
  [
    "Company record is name-only; confidence is reduced.",
    "Zum Unternehmen ist nur der Name bekannt; das Vertrauen sinkt.",
  ],
  ["Independent signals corroborate the opportunity.", "Unabhängige Signale stützen die Chance."],
  [
    "No signals were provided for this opportunity.",
    "Für diese Chance liegen keine Signale vor.",
  ],
  [
    "Freshness cannot be scored without a signal.",
    "Die Aktualität kann ohne Signal nicht bewertet werden.",
  ],
  ["Opportunity Score:", "Greet:"],
  ["Signal Strength:", "Signalstärke:"],
  ["Freshness:", "Aktualität:"],
  ["Company Fit:", "Unternehmens-Fit:"],
  ["Contact Fit:", "Kontakt-Fit:"],
  ["Confidence:", "Sicherheit:"],
  ["Weighted contributions (max 100):", "Gewichtete Beiträge (max. 100):"],
  ["Factor detail:", "Faktor-Details:"],
];

function enumLabel(
  raw: string,
  labels: Record<string, string>,
): string {
  const key = raw.trim().replaceAll(" ", "_");
  return labels[key] ?? raw.trim();
}

export function localizeVisibleCopy(text: string): string {
  let out = text;
  for (const [from, to] of EXACT_REPLACEMENTS) {
    out = out.replaceAll(from, to);
  }

  out = out.replace(/× weight /g, "× Gewicht ");

  out = out.replace(
    /Signal is less than \d+ days old \((\d+) days?\)\./g,
    (_match, days: string) => `Das Signal ist ${days} ${days === "1" ? "Tag" : "Tage"} alt.`,
  );
  out = out.replace(
    /Signal is (?:30–60|60–90|90–180) days old \((\d+) days?\)\./g,
    (_match, days: string) => `Das Signal ist ${days} Tage alt.`,
  );
  out = out.replace(
    /Signal is older than 180 days \((\d+) days?\)\./g,
    (_match, days: string) => `Das Signal ist ${days} Tage alt.`,
  );

  out = out.replace(
    /([A-Z][A-Z0-9_ ]+) has a base strength of (\d+)\./g,
    (_match, type: string, score: string) =>
      `${enumLabel(type, SIGNAL_TYPE_LABELS)} hat eine Signalstärke von ${score}.`,
  );
  out = out.replace(
    /([A-Z][A-Z0-9_ ]+) adds (\d+) points\./g,
    (_match, type: string, points: string) =>
      `${enumLabel(type, SOURCE_TYPE_LABELS)} erhöht die Stärke um ${points} Punkte.`,
  );
  out = out.replace(
    /(\d+) related signals reinforce the opportunity\./g,
    "$1 zusammenhängende Signale stützen die Chance.",
  );
  out = out.replace(
    /Credibility (\d+)\/100 adjusts strength by (-?\d+)\./g,
    "Glaubwürdigkeit $1/100 passt die Stärke um $2 an.",
  );
  out = out.replace(
    /Primary source credibility (\d+)\/100\./g,
    "Glaubwürdigkeit der Hauptquelle $1/100.",
  );
  out = out.replace(/Contact confidence (\d+)\/100\./g, "Kontaktvertrauen $1/100.");
  out = out.replace(
    /Industry “([^”]+)” is outside the current target list\./g,
    "Die Branche „$1“ liegt außerhalb der aktuellen Zielliste.",
  );
  out = out.replace(
    /([A-Z]+) is within the preferred size band\./g,
    "$1 liegt in der bevorzugten Größenklasse.",
  );
  out = out.replace(
    /(\d+) employees meet the minimum target threshold\./g,
    "$1 Mitarbeitende erfüllen die Mindestgröße.",
  );
  out = out.replace(
    /([A-Z][A-Z0-9_ ]+) is treated as a decision maker\./g,
    (_match, role: string) => `${enumLabel(role, CONTACT_ROLE_LABELS)} gilt als Entscheider.`,
  );
  out = out.replace(
    /([A-Z][A-Z0-9_ ]+) is a relevant stakeholder, not a top decision maker\./g,
    (_match, role: string) =>
      `${enumLabel(role, CONTACT_ROLE_LABELS)} ist ein relevanter Stakeholder, aber kein Top-Entscheider.`,
  );

  return out;
}

export function displayStoredText(value: string | null | undefined, empty = "—"): string {
  if (!value) return empty;
  return localizeVisibleCopy(value);
}

export function displayOpportunityTitle(title: string): string {
  const localized = localizeVisibleCopy(title);
  const match = /^(.*?) — ([A-Z][A-Z0-9 ]+)$/.exec(localized);
  const suffix = match?.[2];
  if (!match || !suffix) {
    return localized.replace(/ — opportunity$/i, " — Chance");
  }
  const label = SIGNAL_TYPE_LABELS[suffix.replaceAll(" ", "_")];
  return label ? `${match[1]} — ${label}` : localized;
}
