export function RadarIcpStats({
  knownCompanies,
  icpMatching,
  onRadar,
}: {
  knownCompanies: number;
  icpMatching: number;
  onRadar: number;
}) {
  return (
    <section className="grid sm:grid-cols-3">
      <Stat value={knownCompanies} label="Bekannte Unternehmen" />
      <Stat value={icpMatching} label="ICP-passend" />
      <Stat value={onRadar} label="Auf dem Radar" />
    </section>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="border-t border-line px-5 py-3 sm:border-l sm:first:border-l-0">
      <p className="font-mono text-2xl tabular text-accent">{value}</p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
        {label}
      </p>
    </div>
  );
}
