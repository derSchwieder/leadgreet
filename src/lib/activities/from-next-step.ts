import { NEXT_STEP_LABELS, type IntelligenceNextStep } from "@/lib/intelligence/types";
import type { ActivityType } from "@/types";

export const NEXT_STEP_ACTIVITY_TYPE: Record<IntelligenceNextStep, ActivityType> = {
  SEND_CONTENT: "EMAIL_SENT",
  CONTACT_EXISTING: "CALL",
  CHECK_FOLLOW_UP: "FOLLOW_UP",
  PREPARE_OUTREACH: "NOTE",
};

export const NEXT_STEP_ACTIVITY_LABELS: Record<IntelligenceNextStep, string> = {
  SEND_CONTENT: "E-Mail gesendet",
  CONTACT_EXISTING: "Anruf",
  CHECK_FOLLOW_UP: "Follow-up",
  PREPARE_OUTREACH: "Notiz",
};

export function activityTypeFromNextStep(nextStep: IntelligenceNextStep): ActivityType {
  return NEXT_STEP_ACTIVITY_TYPE[nextStep];
}

export function activityLabelFromNextStep(nextStep: IntelligenceNextStep): string {
  return NEXT_STEP_ACTIVITY_LABELS[nextStep];
}

export function nextStepDescription(nextStep: IntelligenceNextStep): string {
  return NEXT_STEP_LABELS[nextStep];
}
