import { formatEnum } from "@/lib/format";

export function SignalTypeBadge({ type }: { type: string }) {
  return <span className="chip-accent">{formatEnum(type)}</span>;
}
