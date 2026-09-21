import { formatEnum } from "@/lib/format";

export function contactDisplayLabel(contact: {
  fullName: string;
  role?: string | null;
}): string {
  if (!contact.role) return contact.fullName;
  return `${contact.fullName} · ${formatEnum(contact.role)}`;
}
