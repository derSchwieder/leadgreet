export function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`chip align-middle ${className}`.trim()} title="Synthetischer Demo-Datensatz">
      Demo
    </span>
  );
}
