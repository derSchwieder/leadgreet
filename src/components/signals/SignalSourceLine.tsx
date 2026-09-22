import { openableSourceUrl } from "@/components/opportunities/greetelligence-view";

export function SignalSourceLine({
  sourceName,
  sourceUrl,
}: {
  sourceName?: string | null;
  sourceUrl?: string | null;
}) {
  const name = sourceName?.trim() ? sourceName.trim() : null;
  const url = openableSourceUrl(sourceUrl);
  if (!name && !url) return null;

  return (
    <p className="text-xs text-ink-muted">
      {name ? `Quelle: ${name}` : "Quelle"}
      {url ? (
        <>
          {" · "}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Quelle öffnen ↗
          </a>
        </>
      ) : null}
    </p>
  );
}
