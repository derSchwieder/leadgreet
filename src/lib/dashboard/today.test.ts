import { describe, expect, it } from "vitest";
import {
  greetingFirstName,
  isDueToday,
  isOverdueTodo,
  pickTodayPriorities,
  todayHeadline,
  todayRecommendation,
  TODAY_HIGH_GREET,
  type TodayActivityInput,
  type TodayGreetInput,
  type TodayOpportunityInput,
  type TodaySignalInput,
  type TodayTodoInput,
} from "./today";

const now = new Date("2026-09-23T15:00:00.000Z");

function todo(overrides: Partial<TodayTodoInput> = {}): TodayTodoInput {
  return {
    id: "todo-1",
    title: "TeamViewer anrufen",
    dueAt: new Date("2026-09-22T12:00:00.000Z"),
    status: "OPEN",
    companyId: "tv",
    companyName: "TeamViewer SE",
    opportunityId: "opp-tv",
    ...overrides,
  };
}

function activity(overrides: Partial<TodayActivityInput> = {}): TodayActivityInput {
  return {
    id: "act-1",
    companyId: "harting",
    companyName: "HARTING Technology Group",
    opportunityId: "opp-harting",
    occurredAt: new Date("2026-09-20T12:00:00.000Z"),
    type: "CALL",
    outcome: "NO_RESPONSE",
    ...overrides,
  };
}

function opportunity(overrides: Partial<TodayOpportunityInput> = {}): TodayOpportunityInput {
  return {
    id: "opp-tv",
    companyId: "tv",
    companyName: "TeamViewer SE",
    status: "NEW",
    ...overrides,
  };
}

function signal(overrides: Partial<TodaySignalInput> = {}): TodaySignalInput {
  return {
    id: "sig-1",
    title: "Tia Troubleshooting",
    type: "AI_AGENT",
    detectedAt: new Date("2026-09-20T12:00:00.000Z"),
    companyId: "tv",
    companyName: "TeamViewer SE",
    ...overrides,
  };
}

function greets(rows: TodayGreetInput[]): Map<string, TodayGreetInput> {
  return new Map(rows.map((row) => [row.companyId, row]));
}

const opportunities = [
  opportunity(),
  opportunity({ id: "opp-harting", companyId: "harting", companyName: "HARTING Technology Group" }),
  opportunity({ id: "opp-bmw", companyId: "bmw", companyName: "BMW AG" }),
];

describe("pickTodayPriorities", () => {
  it("picks the earliest overdue open todo as hero", () => {
    const picked = pickTodayPriorities({
      now,
      todos: [
        todo({ id: "later", dueAt: new Date("2026-09-21T12:00:00.000Z") }),
        todo({
          id: "first",
          dueAt: new Date("2026-09-20T12:00:00.000Z"),
          companyId: "harting",
          companyName: "HARTING Technology Group",
          opportunityId: "opp-harting",
        }),
      ],
      activities: [activity()],
      opportunities,
      signals: [signal()],
      greets: greets([{ companyId: "tv", greet: 75, signalTitle: "Tia" }]),
    });

    expect(picked.hero?.kind).toBe("todo");
    expect(picked.hero?.todoId).toBe("first");
    expect(picked.hero?.companyId).toBe("harting");
  });

  it("picks an open todo due today before follow-up", () => {
    const picked = pickTodayPriorities({
      now,
      todos: [todo({ dueAt: new Date("2026-09-23T12:00:00.000Z") })],
      activities: [activity()],
      opportunities,
      signals: [signal()],
      greets: greets([{ companyId: "tv", greet: 90, signalTitle: "Tia" }]),
    });

    expect(picked.hero?.kind).toBe("todo");
    expect(picked.hero?.todoDue).toBe("today");
    expect(picked.hero?.todoId).toBe("todo-1");
    expect(picked.hero?.companyId).toBe("tv");
    expect(picked.more.every((card) => card.todoId !== "todo-1")).toBe(true);
  });

  it("keeps overdue todos above todos that are due today", () => {
    const picked = pickTodayPriorities({
      now,
      todos: [
        todo({
          id: "today",
          dueAt: new Date("2026-09-23T12:00:00.000Z"),
        }),
        todo({
          id: "overdue",
          dueAt: new Date("2026-09-21T12:00:00.000Z"),
          companyId: "harting",
          companyName: "HARTING Technology Group",
          opportunityId: "opp-harting",
        }),
      ],
      activities: [],
      opportunities,
      signals: [],
      greets: greets([]),
    });

    expect(picked.hero?.todoId).toBe("overdue");
    expect(picked.hero?.todoDue).toBe("overdue");
    expect(picked.more).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ todoId: "today", todoDue: "today", companyId: "tv" }),
      ]),
    );
  });

  it("turns additional due-today todos into further rows", () => {
    const picked = pickTodayPriorities({
      now,
      todos: [
        todo({ dueAt: new Date("2026-09-23T09:00:00.000Z") }),
        todo({
          id: "todo-bmw",
          title: "BMW nachfassen",
          dueAt: new Date("2026-09-23T16:00:00.000Z"),
          companyId: "bmw",
          companyName: "BMW AG",
          opportunityId: "opp-bmw",
        }),
      ],
      activities: [activity()],
      opportunities,
      signals: [signal()],
      greets: greets([{ companyId: "tv", greet: 90, signalTitle: "Tia" }]),
    });

    expect(picked.hero?.todoId).toBe("todo-1");
    expect(picked.more.map((card) => card.companyId)).toContain("bmw");
    expect(picked.more.find((card) => card.companyId === "bmw")?.todoDue).toBe("today");
    expect(picked.more.every((card) => card.companyId !== picked.hero?.companyId)).toBe(true);
  });

  it("uses follow-up when no overdue or due-today todo exists", () => {
    const picked = pickTodayPriorities({
      now,
      todos: [todo({ dueAt: new Date("2026-09-24T12:00:00.000Z") })],
      activities: [activity()],
      opportunities,
      signals: [signal()],
      greets: greets([{ companyId: "tv", greet: 90, signalTitle: "Tia" }]),
    });

    expect(picked.hero?.kind).toBe("follow_up");
    expect(picked.hero?.companyId).toBe("harting");
  });

  it("uses a fresh high-greet signal with an opportunity as the third hero rule", () => {
    const picked = pickTodayPriorities({
      now,
      todos: [],
      activities: [activity({ outcome: "INTERESTED" })],
      opportunities,
      signals: [signal()],
      greets: greets([{ companyId: "tv", greet: 75, signalTitle: "Tia" }]),
    });

    expect(picked.hero?.kind).toBe("signal");
    expect(picked.hero?.companyId).toBe("tv");
    expect(picked.hero?.greet).toBe(75);
    expect(picked.hero?.signalTitle).toBe("Tia Troubleshooting");
  });

  it("does not treat a stored opportunity snapshot as greet", () => {
    const picked = pickTodayPriorities({
      now,
      todos: [],
      activities: [],
      opportunities,
      signals: [signal()],
      greets: greets([]),
    });

    expect(picked.hero?.kind).not.toBe("signal");
    expect(picked.hero?.greet).toBeNull();
  });

  it("ignores a high-greet signal without an active opportunity", () => {
    const picked = pickTodayPriorities({
      now,
      todos: [],
      activities: [],
      opportunities: [opportunity({ status: "LOST" })],
      signals: [signal()],
      greets: greets([{ companyId: "tv", greet: 90, signalTitle: "Tia" }]),
    });

    expect(picked.hero).toBeNull();
  });

  it("keeps a company off the secondary list when it is already the hero", () => {
    const picked = pickTodayPriorities({
      now,
      todos: [todo()],
      activities: [activity({ companyId: "tv", companyName: "TeamViewer SE", opportunityId: "opp-tv" })],
      opportunities,
      signals: [signal()],
      greets: greets([{ companyId: "tv", greet: 75, signalTitle: "Tia" }]),
    });

    expect(picked.hero?.companyId).toBe("tv");
    expect(picked.more.every((card) => card.companyId !== "tv")).toBe(true);
  });

  it("limits further priorities to four unique companies", () => {
    const extras = [0, 1, 2, 3, 4, 5].map((index) =>
      opportunity({
        id: `opp-${index}`,
        companyId: `c-${index}`,
        companyName: `Firma ${index}`,
      }),
    );
    const extraTodos = extras.map((row, index) =>
      todo({
        id: `todo-${index}`,
        companyId: row.companyId,
        companyName: row.companyName,
        opportunityId: row.id,
        dueAt: new Date(`2026-09-2${index}T12:00:00.000Z`),
      }),
    );

    const picked = pickTodayPriorities({
      now,
      todos: extraTodos,
      activities: [],
      opportunities: extras,
      signals: [],
      greets: greets([]),
    });

    expect(picked.hero?.companyId).toBe("c-0");
    expect(picked.more).toHaveLength(4);
    expect(new Set(picked.more.map((card) => card.companyId)).size).toBe(4);
    expect(picked.more.some((card) => card.companyId === picked.hero?.companyId)).toBe(false);
  });

  it("promotes the first remaining priority to hero when rules 1-4 are empty", () => {
    const picked = pickTodayPriorities({
      now,
      todos: [],
      activities: [],
      opportunities,
      signals: [],
      greets: greets([
        { companyId: "bmw", greet: 88, signalTitle: "Neue Klasse" },
        { companyId: "tv", greet: 75, signalTitle: "Tia" },
      ]),
    });

    expect(picked.hero?.kind).toBe("next_step");
    expect(picked.hero?.companyId).toBe("bmw");
    expect(picked.more.some((card) => card.companyId === "bmw")).toBe(false);
  });

  it("does not promote a greet below the existing high bar as a signal hero", () => {
    const picked = pickTodayPriorities({
      now,
      todos: [],
      activities: [],
      opportunities,
      signals: [signal()],
      greets: greets([{ companyId: "tv", greet: TODAY_HIGH_GREET - 1, signalTitle: "Tia" }]),
    });

    expect(picked.hero?.kind).not.toBe("signal");
  });
});

describe("today copy helpers", () => {
  it("uses the first name for the greeting", () => {
    expect(greetingFirstName("Sebastian Schwiedernoch")).toBe("Sebastian");
    expect(greetingFirstName("Demo User")).toBe("Demo");
  });

  it("keeps the existing next-step wording for the hero line", () => {
    expect(todayHeadline("TeamViewer SE", "CONTACT_EXISTING", true)).toBe(
      "Heute zuerst: TeamViewer SE kontaktieren",
    );
    expect(todayHeadline("HARTING Technology Group", "CHECK_FOLLOW_UP", false)).toBe(
      "HARTING Technology Group nachfassen",
    );
  });

  it("treats dueAt on the current calendar day as due today, not overdue", () => {
    expect(isDueToday(new Date("2026-09-23T08:00:00.000Z"), now)).toBe(true);
    expect(isOverdueTodo(new Date("2026-09-23T08:00:00.000Z"), now)).toBe(false);
    expect(isOverdueTodo(new Date("2026-09-22T18:00:00.000Z"), now)).toBe(true);
  });

  it("names the person in todo recommendations and researches a contact otherwise", () => {
    expect(
      todayRecommendation({
        hero: true,
        kind: "todo",
        companyName: "Müller GmbH",
        nextStep: "CONTACT_EXISTING",
        contactName: "Thomas Müller",
        topic: null,
        todoTitle: "Rückruf",
        todoDue: "overdue",
      }),
    ).toBe("Heute zuerst: Rückruf bei Müller erledigen");

    expect(
      todayRecommendation({
        hero: true,
        kind: "todo",
        companyName: "Climaline",
        nextStep: "SEND_CONTENT",
        contactName: "Anna Meier",
        topic: null,
        todoTitle: "Content senden",
        todoDue: "today",
      }),
    ).toBe("Heute Anna Meier passenden Content senden");

    expect(
      todayRecommendation({
        hero: true,
        kind: "todo",
        companyName: "Schaeffler",
        nextStep: "PREPARE_OUTREACH",
        contactName: null,
        topic: "Data Platform",
        todoTitle: "Ansprechpartner klären",
        todoDue: "today",
      }),
    ).toBe("Heute Ansprechpartner für Data Platform bei Schaeffler recherchieren");

    expect(
      todayRecommendation({
        hero: false,
        kind: "next_step",
        companyName: "Schaeffler",
        nextStep: "CONTACT_EXISTING",
        contactName: null,
        topic: null,
        todoTitle: null,
        todoDue: null,
      }),
    ).toBe("Ansprechpartner bei Schaeffler recherchieren");
  });
});
