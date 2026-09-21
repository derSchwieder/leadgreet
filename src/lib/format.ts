import { translateCountry, translateEnum, translateIndustry } from "./labels";

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function formatTime(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0) {
    return null;
  }
  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDays(days: number | null | undefined): string {
  if (days === null || days === undefined) return "—";
  if (days <= 0) return "Heute";
  if (days === 1) return "1 Tag";
  return `${days} Tage`;
}

export function display(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export function displayIndustry(value: string | null | undefined): string {
  if (!value) return "—";
  return translateIndustry(value);
}

export function displayLocation(
  city: string | null | undefined,
  country: string | null | undefined,
  region?: string | null,
): string {
  const parts = [city || null, region || null, country ? translateCountry(country) : null].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "—";
}

export function formatEnum(value: string | null | undefined): string {
  if (!value) return "—";
  return translateEnum(value);
}

export function scoreTone(score: number): "hot" | "warm" | "cool" {
  if (score >= 80) return "hot";
  if (score >= 60) return "warm";
  return "cool";
}
