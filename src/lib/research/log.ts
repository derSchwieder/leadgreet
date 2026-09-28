export function logWebResearch(event: {
  screeningId?: string;
  provider: string;
  query: string;
  resultCount: number;
  durationMs: number;
  status: "ok" | "empty" | "error" | "timeout";
}) {
  console.info("[web-research]", {
    screeningId: event.screeningId ?? null,
    provider: event.provider,
    query: event.query,
    resultCount: event.resultCount,
    durationMs: event.durationMs,
    status: event.status,
  });
}
