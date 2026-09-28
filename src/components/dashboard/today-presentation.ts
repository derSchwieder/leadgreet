import type { TodayKind } from "@/lib/dashboard/today";
import type { TodayPriorityView } from "@/lib/dashboard/today-view";

export const TODAY_KIND_LABEL: Record<TodayKind, string> = {
  todo: "Todo fällig",
  follow_up: "Follow-up",
  signal: "Neues Signal",
  next_step: "Nächster Schritt",
};

export function todayKindLabel(card: Pick<TodayPriorityView, "kind" | "todoDue">): string {
  if (card.kind === "todo" && card.todoDue === "today") return "Todo heute fällig";
  if (card.kind === "todo") return "Todo überfällig";
  return TODAY_KIND_LABEL[card.kind];
}

export function compactTodayActionLabel(card: TodayPriorityView): string {
  if (!card.contactName && card.kind !== "todo") return "Recherchieren";
  if (card.kind === "todo") return "Erledigen";
  if (card.kind === "follow_up") return "Kontaktieren";
  if (card.kind === "signal") return "Öffnen";
  if (card.nextStep === "SEND_CONTENT") return "Content senden";
  if (card.nextStep === "PREPARE_OUTREACH") return "Vorbereiten";
  if (card.nextStep === "CHECK_FOLLOW_UP") return "Nachfassen";
  return "Öffnen";
}
