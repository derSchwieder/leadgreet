"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRightIcon } from "@/components/icons/LeadgreetIcons";

export function CompleteTodoButton({
  todoId,
  variant = "ghost",
  label = "Todo erledigen",
}: {
  todoId: string;
  variant?: "ghost" | "inline" | "row";
  label?: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function complete() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DONE" }),
      });
      if (!response.ok) {
        setError("Todo konnte nicht erledigt werden.");
        return;
      }
      router.refresh();
    } catch {
      setError("Todo konnte nicht erledigt werden.");
    } finally {
      setSaving(false);
    }
  }

  const className =
    variant === "row"
      ? "inline-flex shrink-0 items-center justify-end gap-1 text-sm font-medium text-accent hover:text-[#3ad7be] disabled:opacity-60"
      : variant === "inline"
        ? "text-sm font-medium text-ink-muted transition hover:text-accent disabled:opacity-60"
        : "btn-ghost";

  return (
    <div className={variant === "row" ? "justify-self-end" : undefined}>
      <button type="button" className={className} disabled={saving} onClick={() => void complete()}>
        {label}
        {variant === "row" ? <ArrowRightIcon size={14} /> : null}
      </button>
      {error ? <p className="mt-1 text-xs text-score-warm">{error}</p> : null}
    </div>
  );
}
