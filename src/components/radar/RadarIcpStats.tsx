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
    <section className="mb-8 grid gap-4 sm:grid-cols-3">
      <Stat value={knownCompanies} label="Bekannte Unternehmen" />
      <Stat value={icpMatching} label="ICP-passend" />
      <Stat value={onRadar} label="Auf dem Radar" />
    </section>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="surface p-5">
      <p className="font-mono text-4xl tabular text-accent">{value}</p>
      <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">
        {label}
      </p>
    </div>
  );
}
