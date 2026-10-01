import type { ContactResearchCandidate } from "@/lib/screening/contacts/types";
import type { ScreeningWebResearchResult } from "@/types";
import { AnalysisError, LLM_INVALID_OUTPUT } from "./errors";
import type {
  EvidenceReference,
  ScreeningAnalysis,
  ScreeningEvidenceConflict,
  ScreeningRelevantContact,
} from "./types";

export const ICP_NOTE =
  "Research-based ICP assessment; existing Leadgreet ICP scoring was not executed.";

const PROFILE_FACT_FIELDS = [
  "industry",
  "businessModel",
  "size",
  "revenue",
  "technologyProfile",
  "transformationProfile",
] as const;

const FORBIDDEN_HYPOTHESIS =
  /(?:\bbenötigt\b|\bsucht aktuell\b|\bwill\b.{0,40}(?:dienstleister|anbieter)|\bplant gerade\b|\bdefinitiv\b)/i;
const HYPOTHESIS_MARKER = /(?:könnte|dürfte|hindeuten|hypothese|möglich(?:e|er|en|es)?|potenziell|denkbar|could\b|might\b|possible need)/i;

export function normalizeEvidenceUrl(url: string): string {
  try {
    const parsed = new URL(url.trim());
    parsed.hash = "";
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    const path = parsed.pathname.replace(/\/+$/, "") || "";
    return `${parsed.protocol}//${host}${path}${parsed.search}`;
  } catch {
    return url.trim().replace(/\/+$/, "").toLowerCase();
  }
}

export function allowedResearchUrls(results: readonly ScreeningWebResearchResult[]): Set<string> {
  return new Set(results.map((result) => normalizeEvidenceUrl(result.url)).filter(Boolean));
}

export function filterEvidence(
  evidence: readonly EvidenceReference[],
  allowed: ReadonlySet<string>,
): EvidenceReference[] {
  const kept: EvidenceReference[] = [];
  const seen = new Set<string>();
  for (const item of evidence) {
    const normalized = normalizeEvidenceUrl(item.url);
    if (!allowed.has(normalized) || seen.has(normalized)) continue;
    seen.add(normalized);
    kept.push(item);
  }
  return kept;
}

export type ScreeningAnalysisSanitizeContext = {
  contacts?: {
    results?: readonly ScreeningWebResearchResult[];
    candidates?: readonly ContactResearchCandidate[];
  };
};

export function sanitizeScreeningAnalysis(
  analysis: ScreeningAnalysis,
  results: readonly ScreeningWebResearchResult[],
  context?: ScreeningAnalysisSanitizeContext,
): ScreeningAnalysis {
  const allowed = allowedResearchUrls(results);
  const cited = collectCitedUrls(analysis);
  const invented = cited.filter((url) => !allowed.has(normalizeEvidenceUrl(url)));
  if (invented.length > 0) {
    throw new AnalysisError(
      LLM_INVALID_OUTPUT,
      "Analysis cited URLs that were not present in the research results.",
    );
  }

  for (const [index, fact] of analysis.facts.entries()) {
    if (fact.kind !== "fact") {
      throw new AnalysisError(LLM_INVALID_OUTPUT, "Facts must use kind=fact.");
    }
    assertRequiredEvidence(fact.evidence, `facts[${index}]`);
  }
  for (const [index, item] of analysis.interpretations.entries()) {
    if (item.kind !== "interpretation") {
      throw new AnalysisError(LLM_INVALID_OUTPUT, "Interpretations must use kind=interpretation.");
    }
    assertRequiredEvidence(item.evidence, `interpretations[${index}]`);
  }
  for (const [index, signal] of analysis.signals.entries()) {
    assertRequiredEvidence(signal.evidence, `signals[${index}]`);
  }
  for (const [index, hypothesis] of analysis.salesHypotheses.entries()) {
    assertRequiredEvidence(hypothesis.evidence, `salesHypotheses[${index}]`);
    assertSalesHypothesisWording(hypothesis.hypothesis);
  }

  const conflicts = analysis.conflicts.map((conflict, index) =>
    sanitizeConflict(conflict, allowed, index),
  );
  const conflictTopics = new Set(conflicts.map((item) => item.topic.toLowerCase()));

  const profileEvidence = enrichEvidence(analysis.companyProfile.evidence, results);
  const profile = {
    ...analysis.companyProfile,
    evidence: profileEvidence,
  };
  if (profileEvidence.length === 0) {
    for (const field of PROFILE_FACT_FIELDS) {
      profile[field] = undefined;
    }
  } else {
    for (const field of PROFILE_FACT_FIELDS) {
      if (conflictTopics.has(field)) profile[field] = undefined;
    }
  }

  const criteria = analysis.icpAssessment.criteria.map((criterion) => {
    const evidence = enrichEvidence(criterion.evidence, results);
    const conflicted = conflictTopics.has(criterion.criterion);
    return {
      ...criterion,
      evidence,
      status: evidence.length === 0 || conflicted ? ("unknown" as const) : criterion.status,
    };
  });

  const limitations = [...analysis.limitations];
  if (!limitations.includes(ICP_NOTE)) limitations.push(ICP_NOTE);
  if (conflicts.length > 0) {
    const note = "Conflicting research evidence was recorded and not resolved.";
    if (!limitations.includes(note)) limitations.push(note);
  }

  return {
    companyProfile: profile,
    facts: analysis.facts.map((item) => ({
      ...item,
      evidence: enrichEvidence(item.evidence, results),
    })),
    interpretations: analysis.interpretations.map((item) => ({
      ...item,
      evidence: enrichEvidence(item.evidence, results),
    })),
    icpAssessment: {
      ...analysis.icpAssessment,
      criteria,
      evidence: enrichEvidence(analysis.icpAssessment.evidence, results),
    },
    signals: analysis.signals.map((item) => ({
      ...item,
      evidence: enrichEvidence(item.evidence, results),
    })),
    salesHypotheses: analysis.salesHypotheses.map((item) => ({
      ...item,
      evidence: enrichEvidence(item.evidence, results),
    })),
    relevantContacts: sanitizeRelevantContacts(analysis, context),
    conflicts,
    limitations,
  };
}

function assertRequiredEvidence(evidence: readonly EvidenceReference[], label: string): void {
  if (evidence.length === 0) {
    throw new AnalysisError(
      LLM_INVALID_OUTPUT,
      `${label} is missing required evidence from the research results.`,
    );
  }
}

function assertSalesHypothesisWording(text: string): void {
  if (FORBIDDEN_HYPOTHESIS.test(text) || !HYPOTHESIS_MARKER.test(text)) {
    throw new AnalysisError(
      LLM_INVALID_OUTPUT,
      "Sales hypotheses must be phrased as hypotheses, not purchase intent.",
    );
  }
}

function sanitizeConflict(
  conflict: ScreeningEvidenceConflict,
  allowed: ReadonlySet<string>,
  index: number,
): ScreeningEvidenceConflict {
  if (conflict.status !== "conflicting_evidence" || conflict.values.length < 2) {
    throw new AnalysisError(
      LLM_INVALID_OUTPUT,
      `conflicts[${index}] is not a valid conflicting_evidence record.`,
    );
  }
  const values = conflict.values.map((item) => {
    if (!allowed.has(normalizeEvidenceUrl(item.source))) {
      throw new AnalysisError(
        LLM_INVALID_OUTPUT,
        `conflicts[${index}] cited a source that was not present in the research results.`,
      );
    }
    return item;
  });
  return { ...conflict, values };
}

function enrichEvidence(
  evidence: readonly EvidenceReference[],
  results: readonly ScreeningWebResearchResult[],
): EvidenceReference[] {
  return evidence.map((item) => {
    const match = results.find(
      (result) => normalizeEvidenceUrl(result.url) === normalizeEvidenceUrl(item.url),
    );
    if (!match) return item;
    return {
      ...item,
      title: item.title ?? match.title,
      publisher: item.publisher ?? match.source ?? undefined,
      publishedAt: item.publishedAt ?? match.publishedAt ?? undefined,
    };
  });
}

function sanitizeRelevantContacts(
  analysis: ScreeningAnalysis,
  context?: ScreeningAnalysisSanitizeContext,
): ScreeningRelevantContact[] {
  const contacts = analysis.relevantContacts ?? [];
  const candidates = context?.contacts?.candidates ?? [];
  const contactResults = context?.contacts?.results ?? [];
  const allowed = allowedResearchUrls(contactResults);
  const knownNames = new Set(candidates.map((item) => normalizePersonName(item.name)));
  const knownSignals = new Set([
    ...analysis.signals.map((item) => item.title.trim().toLocaleLowerCase("de")),
    ...candidates.flatMap((item) =>
      item.relatedSignals.map((signal) => signal.trim().toLocaleLowerCase("de")),
    ),
  ]);

  if (contacts.length > 0 && candidates.length === 0) {
    throw new AnalysisError(
      LLM_INVALID_OUTPUT,
      "Analysis invented a contact that was not present in the contact research results.",
    );
  }

  return contacts.map((contact, index) => {
    const candidate = candidates.find(
      (item) => normalizePersonName(item.name) === normalizePersonName(contact.name),
    );
    if (!candidate || !knownNames.has(normalizePersonName(contact.name))) {
      throw new AnalysisError(
        LLM_INVALID_OUTPUT,
        `relevantContacts[${index}] invented a person that was not present in the contact research results.`,
      );
    }
    if (contact.evidence.length === 0) {
      throw new AnalysisError(
        LLM_INVALID_OUTPUT,
        `relevantContacts[${index}] is missing required evidence.`,
      );
    }
    for (const item of contact.evidence) {
      if (!allowed.has(normalizeEvidenceUrl(item.url))) {
        throw new AnalysisError(
          LLM_INVALID_OUTPUT,
          `relevantContacts[${index}] cited a URL that was not present in the contact research results.`,
        );
      }
    }
    if (contact.profileUrl && !allowed.has(normalizeEvidenceUrl(contact.profileUrl))) {
      throw new AnalysisError(
        LLM_INVALID_OUTPUT,
        `relevantContacts[${index}] invented a profile URL.`,
      );
    }
    return {
      name: candidate.name,
      role: candidate.role,
      company: candidate.company,
      profileUrl: candidate.profileUrl,
      evidence: enrichEvidence(contact.evidence, contactResults),
      relevance: contact.relevance,
      relevanceReason: contact.relevanceReason,
      relatedSignals: contact.relatedSignals.filter((signal) =>
        knownSignals.has(signal.trim().toLocaleLowerCase("de")),
      ),
    };
  });
}

function normalizePersonName(name: string): string {
  return name.replace(/\s+/g, " ").trim().toLocaleLowerCase("de");
}

function collectCitedUrls(analysis: ScreeningAnalysis): string[] {
  return [
    ...analysis.companyProfile.evidence,
    ...analysis.facts.flatMap((item) => item.evidence),
    ...analysis.interpretations.flatMap((item) => item.evidence),
    ...analysis.icpAssessment.evidence,
    ...analysis.icpAssessment.criteria.flatMap((item) => item.evidence),
    ...analysis.signals.flatMap((item) => item.evidence),
    ...analysis.salesHypotheses.flatMap((item) => item.evidence),
    ...analysis.conflicts.flatMap((item) => item.values.map((value) => ({ url: value.source }))),
  ].map((item) => item.url);
}
