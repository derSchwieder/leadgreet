"use client";

import { useId } from "react";

const inputClass =
  "w-full rounded-lg border border-line bg-canvas py-2 pl-3 pr-9 text-sm text-ink placeholder:text-ink-faint [&::-webkit-search-cancel-button]:hidden";

export function EntitySearchField({
  value,
  onChange,
  placeholder,
  id,
  label = "Suche",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  id?: string;
  label?: string;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hasQuery = value.length > 0;

  return (
    <div className="relative max-w-md">
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onChange("");
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className={inputClass}
      />
      {hasQuery ? (
        <button
          type="button"
          aria-label="Suche zurücksetzen"
          onClick={() => onChange("")}
          className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-ink-muted transition hover:bg-canvas-hover hover:text-ink"
        >
          <span aria-hidden="true" className="text-base leading-none">
            ×
          </span>
        </button>
      ) : null}
    </div>
  );
}
