import {
  ArrowRightIcon,
  CheckCircleIcon,
  FlameIcon,
  RotateCcwIcon,
  SparklesIcon,
} from "@/components/icons/LeadgreetIcons";
import type { TodayKind } from "@/lib/dashboard/today";

export function TodayKindIcon({
  kind,
  featured = false,
  size,
}: {
  kind: TodayKind;
  featured?: boolean;
  size?: number;
}) {
  const iconSize = size ?? (featured ? 14 : 16);

  if (featured) {
    return <FlameIcon size={iconSize} />;
  }
  if (kind === "todo") {
    return <CheckCircleIcon size={iconSize} />;
  }
  if (kind === "follow_up") {
    return <RotateCcwIcon size={iconSize} />;
  }
  if (kind === "signal") {
    return <SparklesIcon size={iconSize} />;
  }
  return <ArrowRightIcon size={iconSize} />;
}
