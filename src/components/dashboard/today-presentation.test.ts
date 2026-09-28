import { describe, expect, it } from "vitest";
import { compactTodayActionLabel, todayKindLabel, TODAY_KIND_LABEL } from "./today-presentation";
import type { TodayPriorityView } from "@/lib/dashboard/today-view";

function card(overrides: Partial<TodayPriorityView>): TodayPriorityView {
  return {
    companyId: "c1",
    companyName: "Beispiel",
    opportunityId: "opp-1",
    kind: "next_step",
    headline: "Beispiel kontaktieren",
    greet: 70,
    occasion: null,
    reason: null,
    nextStep: "CONTACT_EXISTING",
    nextActionTitle: "Passenden Ansprechpartner kontaktieren",
    channelLabel: null,
    todoId: null,
    todoTitle: null,
    todoDue: null,
    contactName: "Anna Meier",
    ...overrides,
  };
}

describe("today presentation labels", () => {
  it("keeps row type labels short and distinct", () => {
    expect(todayKindLabel({ kind: "todo", todoDue: "today" })).toBe("Todo heute fällig");
    expect(todayKindLabel({ kind: "todo", todoDue: "overdue" })).toBe("Todo überfällig");
    expect(TODAY_KIND_LABEL.follow_up).toBe("Follow-up");
    expect(TODAY_KIND_LABEL.signal).toBe("Neues Signal");
    expect(TODAY_KIND_LABEL.next_step).toBe("Nächster Schritt");
  });

  it("maps compact row actions without inventing new next-action logic", () => {
    expect(compactTodayActionLabel(card({ kind: "todo" }))).toBe("Erledigen");
    expect(compactTodayActionLabel(card({ kind: "follow_up" }))).toBe("Kontaktieren");
    expect(compactTodayActionLabel(card({ kind: "signal" }))).toBe("Öffnen");
    expect(compactTodayActionLabel(card({ kind: "next_step", nextStep: "SEND_CONTENT" }))).toBe(
      "Content senden",
    );
    expect(compactTodayActionLabel(card({ kind: "next_step", contactName: null }))).toBe(
      "Recherchieren",
    );
  });
});
