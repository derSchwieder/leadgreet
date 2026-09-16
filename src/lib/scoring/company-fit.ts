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
    label: "Unenriched baseline",
    points: 40,
    detail: "Start at 40 when the company is on the radar without a full profile.",
  });

  const industryHit = includesIgnoreCase(
    TARGET_COMPANY_PROFILE.preferredIndustries,
    company.industry,
  ) || includesIgnoreCase(TARGET_COMPANY_PROFILE.preferredIndustries, company.subIndustry);

  if (industryHit) {
    score += 25;
    factors.push({
      code: "industry",
      label: "Industry match",
      points: 25,
      detail: "Industry matches the leadgreet target profile (industrial / tech-adjacent).",
    });
  } else if (!company.industry) {
    factors.push({
      code: "industry_unknown",
      label: "Industry unknown",
      points: 0,
      detail: "No industry on file — profile has not been enriched yet.",
    });
  } else {
    score -= 8;
    factors.push({
      code: "industry_mismatch",
      label: "Industry outside core profile",
      points: -8,
      detail: `Industry “${company.industry}” is outside the current target list.`,
    });
  }

  if (
    company.companySize &&
    (TARGET_COMPANY_PROFILE.preferredSizes as readonly string[]).includes(company.companySize)
  ) {
    score += 15;
    factors.push({
      code: "size",
      label: "Company size match",
      points: 15,
      detail: `${company.companySize} is within the preferred size band.`,
    });
  } else if (
    company.employees !== null &&
    company.employees >= TARGET_COMPANY_PROFILE.minEmployees
  ) {
    score += 10;
    factors.push({
      code: "employees",
      label: "Employee count",
      points: 10,
      detail: `${company.employees} employees meet the minimum target threshold.`,
    });
  }

  if (includesIgnoreCase(TARGET_COMPANY_PROFILE.preferredCountries, company.country)) {
    score += 12;
    factors.push({
      code: "geo",
      label: "Geography match",
      points: 12,
      detail: "Country is in the DACH focus region.",
    });
  } else if (!company.country) {
    factors.push({
      code: "geo_unknown",
      label: "Location unknown",
      points: 0,
      detail: "No country on file.",
    });
  }

  if (company.website) {
    score += 5;
    factors.push({
      code: "web",
      label: "Website on file",
      points: 5,
      detail: "A company website is available for further research.",
    });
  }

  if (company.revenue) {
    score += 5;
    factors.push({
      code: "revenue",
      label: "Revenue on file",
      points: 5,
      detail: "Revenue data improves account qualification.",
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
      label: "Profile not enriched",
      points: 0,
      detail: "Company fit is limited because only the company name is known.",
    });
  }

  return { score: clampScore(score), factors };
}
