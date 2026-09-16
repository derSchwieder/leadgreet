import type { ContactRole, SignalType } from "@/types";
import {
  clampScore,
  type ComponentScoreResult,
  type ScoringContactInput,
  type ScoringSignalInput,
} from "./types";

const DECISION_ROLES: readonly ContactRole[] = [
  "CEO",
  "MANAGING_DIRECTOR",
  "CIO",
  "CTO",
  "CDO",
  "COO",
];

const ROLE_SIGNAL_AFFINITY: Partial<Record<ContactRole, readonly SignalType[]>> = {
  CIO: [
    "CLOUD_MIGRATION",
    "ERP_TRANSFORMATION",
    "DIGITAL_TRANSFORMATION",
    "IT_REORGANIZATION",
    "SOFTWARE_MODERNIZATION",
    "NEW_CIO",
  ],
  CTO: [
    "SOFTWARE_MODERNIZATION",
    "AI_PROJECT",
    "AI_AGENT",
    "GENAI",
    "CLOUD_MIGRATION",
    "NEW_CTO",
  ],
  CDO: ["DATA_PLATFORM", "DATA_ANALYTICS", "GENAI", "AI_STRATEGY", "NEW_CDO"],
  HEAD_OF_AI: ["AI_PROJECT", "AI_STRATEGY", "AI_AGENT", "GENAI", "AI_RECRUITING"],
  HEAD_OF_DATA: ["DATA_PLATFORM", "DATA_ANALYTICS", "GENAI"],
  HEAD_OF_IT: [
    "CLOUD_MIGRATION",
    "ERP_TRANSFORMATION",
    "IT_RECRUITING",
    "SOFTWARE_MODERNIZATION",
  ],
  HEAD_OF_DIGITALIZATION: ["DIGITAL_TRANSFORMATION", "PROCESS_AUTOMATION", "AI_STRATEGY"],
  HEAD_OF_INNOVATION: ["AI_STRATEGY", "GENAI", "NEW_INNOVATION_LEAD", "AI_PROJECT"],
  HEAD_OF_TRANSFORMATION: [
    "DIGITAL_TRANSFORMATION",
    "ERP_TRANSFORMATION",
    "PROCESS_AUTOMATION",
  ],
  HEAD_OF_SOFTWARE: ["SOFTWARE_MODERNIZATION", "AI_AGENT", "CLOUD_MIGRATION"],
  CEO: ["M_AND_A", "FUNDING", "INVESTMENT", "EXPANSION", "AI_STRATEGY"],
  MANAGING_DIRECTOR: ["M_AND_A", "FUNDING", "INVESTMENT", "EXPANSION", "AI_STRATEGY"],
  COO: ["PROCESS_AUTOMATION", "ERP_TRANSFORMATION", "EXPANSION"],
};

export function scoreContactFit(
  contact: ScoringContactInput | null,
  signals: ScoringSignalInput[],
): ComponentScoreResult {
  if (!contact) {
    return {
      score: 20,
      factors: [
        {
          code: "no_contact",
          label: "No decision maker identified",
          points: 20,
          detail: "Opportunity can still be worked, but outreach target is missing.",
        },
      ],
    };
  }

  const factors: ComponentScoreResult["factors"] = [];
  let score = 45;

  factors.push({
    code: "identified",
    label: "Contact identified",
    points: 45,
    detail: "A named contact exists for this account.",
  });

  if (contact.isDecisionMaker || DECISION_ROLES.includes(contact.role)) {
    score += 25;
    factors.push({
      code: "decision_maker",
      label: "Decision maker",
      points: 25,
      detail: `${contact.role.replaceAll("_", " ")} is treated as a decision maker.`,
    });
  } else {
    score += 8;
    factors.push({
      code: "influencer",
      label: "Influencer role",
      points: 8,
      detail: `${contact.role.replaceAll("_", " ")} is a relevant stakeholder, not a top decision maker.`,
    });
  }

  const types = new Set(signals.map((signal) => signal.type));
  const affinity = ROLE_SIGNAL_AFFINITY[contact.role] ?? [];
  const matched = affinity.filter((type) => types.has(type));
  if (matched.length > 0) {
    const points = Math.min(20, 10 + matched.length * 4);
    score += points;
    factors.push({
      code: "role_affinity",
      label: "Role matches signal",
      points,
      detail: `${contact.role.replaceAll("_", " ")} aligns with ${matched.join(", ")}.`,
    });
  }

  if (contact.email || contact.linkedinUrl) {
    score += 8;
    factors.push({
      code: "reachable",
      label: "Reachability",
      points: 8,
      detail: "Email or LinkedIn is on file.",
    });
  }

  return { score: clampScore(score), factors };
}
