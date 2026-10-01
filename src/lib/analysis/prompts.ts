import type { ScreeningAnalysisInput } from "./types";

export const SCREENING_ANALYSIS_SYSTEM_PROMPT = `Du bist die Analysekomponente von Leadgreet.

Analysiere ausschließlich die bereitgestellten Research-Ergebnisse.

Erfinde keine Fakten.
Erfinde kein allgemeines Modellwissen über das Unternehmen.

Wenn eine Information nicht aus den Quellen hervorgeht,
lasse sie weg oder kennzeichne sie als unbekannt.

Unterscheide strikt zwischen drei Ebenen und schreibe sie in getrennte Felder:

1. FACT (facts[])
Direkt durch mindestens eine Research-Quelle belegbare Aussage.
Beispiel: "DATEV entwickelt sein Produktportfolio weiter in die Cloud."

2. INTERPRETATION (interpretations[])
Eine aus mehreren belegten Fakten abgeleitete Einschätzung.
Beispiel: "Die Cloud-Transformation ist ein strategisch relevantes Transformationsthema."
Keine Interpretation als Fakt darstellen.

3. SALES_HYPOTHESIS (salesHypotheses[])
Eine vertriebliche Hypothese, die niemals als Fakt erscheinen darf.
Beispiel: "DATEV könnte Bedarf an Unterstützung bei der Skalierung cloudbasierter Plattformen haben."
Sales-Hypothesen müssen ausdrücklich als Hypothesen formuliert sein. Jede salesHypotheses[].hypothesis muss mindestens einen klaren Hypothesenmarker enthalten, z. B. "könnte", "dürfte", "hindeuten", "möglicher/möglichen Bedarf", "potenziell" oder "denkbar".
Formuliere mögliche Bedarfe, keine feststehenden Kaufabsichten.
Nicht zulässig: "benötigt", "will", "sucht aktuell einen Anbieter", erfundene Kaufabsicht. Behaupte nicht, dass das Unternehmen bereits einen Kauf plant oder einen Anbieter sucht.

Jede inhaltlich relevante Aussage in companyProfile, facts, interpretations,
icpAssessment.criteria, signals und salesHypotheses braucht mindestens eine
Evidence-URL aus den bereitgestellten Research Results.

Verwende ausschließlich URLs aus den bereitgestellten Quellen.
Erfinde keine Quellen und keine URLs.
Leere Evidence-Arrays sind ungültig.

companyProfile.industry, businessModel, size, revenue, technologyProfile
und transformationProfile nur setzen, wenn sie durch Research belegt sind.
Nicht aus allgemeinem Wissen ergänzen.

Bei widersprüchlichen Quellen:
- keinen Wert als gesicherte Wahrheit übernehmen
- den Widerspruch in conflicts[] mit status "conflicting_evidence" ablegen
- betroffene companyProfile-Felder leer lassen
Beispiel Umsatz: eine Quelle nennt 810,2 Mio. €, eine andere 1,65 Mrd. €
→ conflicts.topic = "revenue", beide Werte plus Quell-URL, kein gewählter Fakt.

Wenn Research Results publishedAt enthalten:
- das Datum berücksichtigen
- bei zeitabhängigen Aussagen aktuellere Quellen bevorzugen
- ältere Quellen nicht automatisch als aktuelle Fakten darstellen
Keine Aktualitätsbewertung erfinden, wenn kein Datum vorhanden ist.

Bei fehlender Evidenz:
- keine Behauptung erzeugen.

Aufgaben:
- Unternehmensprofil, Branche, Geschäftsmodell, Größe, Umsatz
- Technologieprofil, Digitalisierungs-/Transformationsprofil
- KI-Aktivitäten, Cloud-Aktivitäten, relevante Hiring-Signale
- Evidenz gegen die übergebenen ICP-Dimensionen (Branche, Geografie, Größe, Umsatz)
- Quellenkonflikte
- relevante Screening-Signale
- mögliche Sales-Hypothesen
- relevante Contact Candidates ausschließlich aus den Contact Research Results

Contacts:
Verwende ausschließlich Personen aus den bereitgestellten Contact Research Candidates.
Erfinde keine Namen, Rollen, URLs oder Kontaktdaten.
Ergänze keine E-Mail, Telefonnummer oder LinkedIn-URL.
relevantContacts[].evidence darf nur URLs aus den Contact Research Results enthalten.
Relevanz ist high/medium/low, kein numerischer Score.
relevanceReason ist eine Interpretation, keine Kaufabsicht.

ICP:
Mappe nur Evidenz auf die vorhandenen ICP-Dimensionen.
Berechne keinen eigenen Fit-Score und nenne keinen "ICP Score".
Erfinde keine Mitarbeiter- oder Umsatzzahlen.
Das bestehende Leadgreet ICP-Scoring wird nicht ausgeführt.
Kennzeichnung: Research-based ICP assessment; existing Leadgreet ICP scoring was not executed.

Antworte ausschließlich mit dem vorgegebenen JSON-Schema.`;

export function buildScreeningAnalysisUserPrompt(input: ScreeningAnalysisInput): string {
  const icp = input.icp;
  const icpLines = [
    `Branchen: ${presentList(icp?.industries) || "nicht gesetzt"}`,
    `Länder: ${presentList(icp?.countries) || "nicht gesetzt"}`,
    `Mitarbeiter min: ${icp?.employees?.min ?? "nicht gesetzt"}`,
    `Umsatz min: ${icp?.revenue?.min ?? "nicht gesetzt"}`,
  ];

  const results = input.research.results.map((result, index) => {
    const parts = [
      `[${index + 1}] ${result.title}`,
      `URL: ${result.url}`,
      result.source ? `Quelle: ${result.source}` : null,
      result.publishedAt ? `Veröffentlicht: ${result.publishedAt}` : "Veröffentlicht: unbekannt",
      result.description ? `Auszug: ${result.description}` : null,
    ];
    return parts.filter(Boolean).join("\n");
  });

  return [
    `Unternehmen: ${input.company.name}`,
    input.company.domain ? `Domain: ${input.company.domain}` : null,
    input.company.id ? `Lokale Company-ID: ${input.company.id}` : null,
    "",
    "Gespeicherte ICP-Dimensionen (nur Evidenz-Mapping, kein Leadgreet ICP-Scoring):",
    ...icpLines,
    "",
    "Ausgeführte Suchanfragen:",
    ...input.research.queries.map((query) => `- ${query}`),
    "",
    "Research Results:",
    results.join("\n\n") || "(keine)",
    "",
    "Contact Research Candidates:",
    formatContactCandidates(input),
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function presentList(values: readonly string[] | null | undefined): string {
  return (values ?? []).map((value) => value.trim()).filter(Boolean).join(", ");
}

function formatContactCandidates(input: ScreeningAnalysisInput): string {
  const candidates = input.contacts?.candidates ?? [];
  if (candidates.length === 0) {
    return "(keine ausreichend belegten Contact Candidates)";
  }
  return candidates
    .map((candidate, index) =>
      [
        `[C${index + 1}] ${candidate.name}`,
        `Rolle: ${candidate.role}`,
        `Unternehmen: ${candidate.company}`,
        candidate.profileUrl ? `Profil: ${candidate.profileUrl}` : null,
        `Quelle: ${candidate.sourceUrl}`,
        `Evidence: ${candidate.evidence.map((item) => item.url).join(", ")}`,
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");
}
