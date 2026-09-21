import { NEXT_STEP_LABELS, type IntelligenceNextStep } from "@/lib/intelligence";

export function todoTitleFromNextStep(nextStep: IntelligenceNextStep): string {
  return NEXT_STEP_LABELS[nextStep];
}
