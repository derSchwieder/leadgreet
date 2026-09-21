import { TARGET_COMPANY_PROFILE } from "./weights";
import {
  clampScore,
  type ComponentScoreResult,
  type ScoringCompanyInput,
} from "./types";

function includesIgnoreCase(haystack: readonly string[], value: string | null): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return haystack.some((item) => normalized.includes(item.toLowerCase()));
}

export function scoreCompanyFit(company: ScoringCompanyInput): ComponentScoreResult {
  const factors: ComponentScoreResult["factors"] = [];
  let score = 40;

  factors.push({
    code: "baseline",
    label: "Unangereichertes Profil",
    points: 40,
    detail: "Startwert 40, wenn das Unternehmen ohne vollständiges Profil im Radar ist.",
  });

  const industryHit = includesIgnoreCase(
    TARGET_COMPANY_PROFILE.preferredIndustries,
    company.industry,
  ) || includesIgnoreCase(TARGET_COMPANY_PROFILE.preferredIndustries, company.subIndustry);

  if (industryHit) {
    score += 25;
    factors.push({
      code: "industry",
      label: "Branchen-Fit",
      points: 25,
      detail: "Die Branche entspricht dem Leadgreet-Zielprofil (Industrie / technologieaffin).",
    });
  } else if (!company.industry) {
    factors.push({
      code: "industry_unknown",
      label: "Branche unbekannt",
      points: 0,
      detail: "Keine Branche hinterlegt — das Profil ist noch nicht angereichert.",
    });
  } else {
    score -= 8;
    factors.push({
      code: "industry_mismatch",
      label: "Branche außerhalb des Kernprofils",
      points: -8,
      detail: `Die Branche „${company.industry}“ liegt außerhalb der aktuellen Zielliste.`,
    });
  }

  if (
    company.companySize &&
    (TARGET_COMPANY_PROFILE.preferredSizes as readonly string[]).includes(company.companySize)
  ) {
    score += 15;
    factors.push({
      code: "size",
      label: "Unternehmensgröße passend",
      points: 15,
      detail: `${company.companySize} liegt in der bevorzugten Größenklasse.`,
    });
  } else if (
    company.employees !== null &&
    company.employees >= TARGET_COMPANY_PROFILE.minEmployees
  ) {
    score += 10;
    factors.push({
      code: "employees",
      label: "Mitarbeitendenzahl",
      points: 10,
      detail: `${company.employees} Mitarbeitende erfüllen die Mindestgröße.`,
    });
  }

  if (includesIgnoreCase(TARGET_COMPANY_PROFILE.preferredCountries, company.country)) {
    score += 12;
    factors.push({
      code: "geo",
      label: "Standort-Fit",
      points: 12,
      detail: "Das Land liegt in der DACH-Fokusregion.",
    });
  } else if (!company.country) {
    factors.push({
      code: "geo_unknown",
      label: "Standort unbekannt",
      points: 0,
      detail: "Kein Land hinterlegt.",
    });
  }

  if (company.website) {
    score += 5;
    factors.push({
      code: "web",
      label: "Website hinterlegt",
      points: 5,
      detail: "Eine Unternehmenswebsite steht für die weitere Recherche zur Verfügung.",
    });
  }

  if (company.revenue) {
    score += 5;
    factors.push({
      code: "revenue",
      label: "Umsatz hinterlegt",
      points: 5,
      detail: "Umsatzdaten verbessern die Account-Qualifizierung.",
    });
  }

  const populated = [
    company.industry,
    company.country,
    company.employees,
    company.companySize,
    company.website,
    company.city,
    company.revenue,
  ].filter((value) => value !== null && value !== undefined && value !== "").length;

  if (populated === 0) {
    factors.push({
      code: "unenriched",
      label: "Profil nicht angereichert",
      points: 0,
      detail: "Der Unternehmens-Fit ist begrenzt, weil nur der Firmenname bekannt ist.",
    });
  }

  return { score: clampScore(score), factors };
}
