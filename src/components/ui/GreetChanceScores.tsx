export function ScoreCallout({
  label,
  score,
  caption,
  align = "left",
}: {
  label: string;
  score: number;
  caption: string;
  align?: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : undefined}>
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">{label}</p>
      <p className="mt-1 font-mono text-3xl tabular text-accent sm:text-4xl">{score}</p>
      <p className="mt-1.5 text-xs leading-4 text-ink-muted">{caption}</p>
    </div>
  );
}

/**
 * Opportunity-page header: GREET is live Company-Greet, CHANCE is the stored
 * Opportunity snapshot. Never copy the snapshot into GREET.
 */
export function toOpportunityHeaderScores(input: {
  companyGreetScore: number | null | undefined;
  opportunityScore: number;
}): { greet: number | null; chance: number } {
  return {
    greet: input.companyGreetScore ?? null,
    chance: input.opportunityScore,
  };
}

export function GreetChanceScores({
  greet,
  chance,
}: {
  greet?: number | null;
  chance?: number | null;
}) {
  const showGreet = greet != null;
  const showChance = chance != null;
  if (!showGreet && !showChance) return null;

  if (showGreet && showChance) {
    return (
      <div className="grid min-w-[16rem] shrink-0 grid-cols-2 gap-3 sm:w-[22rem]">
        <div className="surface px-3.5 py-3" data-score-kind="greet">
          <ScoreCallout label="Greet" score={greet} caption="aktuelle Vertriebsrelevanz" />
        </div>
        <div className="surface px-3.5 py-3" data-score-kind="chance">
          <ScoreCallout label="Chance" score={chance} caption="dieser konkrete Vertriebsanlass" />
        </div>
      </div>
    );
  }

  if (showGreet) {
    return (
      <div data-score-kind="greet">
        <ScoreCallout label="Greet" score={greet} caption="aktuelle Vertriebsrelevanz" align="right" />
      </div>
    );
  }

  return (
    <div data-score-kind="chance">
      <ScoreCallout
        label="Chance"
        score={chance!}
        caption="dieser konkrete Vertriebsanlass"
        align="right"
      />
    </div>
  );
}
