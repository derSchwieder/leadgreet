import type {
  CompanyScreeningCompanyProfile,
  CompanyScreeningContactRef,
  CompanyScreeningIcpAssessment,
  CompanyScreeningResultPayload,
  CompanyScreeningSignalRef,
  ScreeningSalesHypothesis,
  ScreeningSource,
} from "@/types";

function hasProfileFact(profile: CompanyScreeningCompanyProfile): boolean {
  return Boolean(
    profile.companyName ||
      profile.domain ||
      profile.description ||
      profile.industry ||
      profile.headquarters ||
      profile.employeeCount ||
      profile.revenue,
  );
}

export function mergeProfiles(
  local: CompanyScreeningCompanyProfile,
  web: CompanyScreeningCompanyProfile,
): CompanyScreeningCompanyProfile {
  return {
    companyName: local.companyName ?? web.companyName ?? null,
    domain: local.domain ?? web.domain ?? null,
    description: local.description ?? web.description ?? null,
    industry: local.industry ?? web.industry ?? null,
    headquarters: local.headquarters ?? web.headquarters ?? null,
    countries: local.countries ?? web.countries ?? null,
    employeeCount: local.employeeCount ?? web.employeeCount ?? null,
    revenue: local.revenue ?? web.revenue ?? null,
    ownership: local.ownership ?? web.ownership ?? null,
    companyType: local.companyType ?? web.companyType ?? null,
    businessModel: local.businessModel ?? web.businessModel ?? null,
    products: local.products ?? web.products ?? null,
  };
}

export function uniqueSources(sources: readonly ScreeningSource[]): ScreeningSource[] {
  const seen = new Set<string>();
  const result: ScreeningSource[] = [];
  for (const source of sources) {
    const key = `${source.url ?? ""}|${source.title}|${source.publisher ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(source);
  }
  return result;
}

export function buildScreeningResult(input: {
  profile: CompanyScreeningCompanyProfile;
  icpAssessment: CompanyScreeningIcpAssessment;
  signals: CompanyScreeningSignalRef[];
  contacts: CompanyScreeningContactRef[];
  salesHypotheses: ScreeningSalesHypothesis[];
  sources: ScreeningSource[];
  localAvailable: boolean;
  webAvailable: boolean;
  llmAvailable: boolean;
}): CompanyScreeningResultPayload {
  const limitations: string[] = [];
  if (!input.webAvailable) {
    limitations.push("Web research is not configured. No public-web facts were added.");
  }
  if (!input.llmAvailable) {
    limitations.push("LLM analysis is not configured. No sales hypotheses were generated.");
  }
  if (!hasProfileFact(input.profile)) {
    limitations.push("No load-bearing company facts were found.");
  }

  const coverage = input.localAvailable && input.webAvailable
    ? "mixed"
    : input.webAvailable
      ? "web"
      : "local_catalog";

  return {
    companyProfile: input.profile,
    icpAssessment: input.icpAssessment,
    signals: input.signals,
    contacts: input.contacts,
    salesHypotheses: input.salesHypotheses,
    sources: uniqueSources(input.sources),
    coverage,
    limitations,
  };
}
