import { formatEnum } from "@/lib/format";

export function ContentTypeBadge({ type }: { type: string }) {
  return <span className="chip-accent">{formatEnum(type)}</span>;
}
