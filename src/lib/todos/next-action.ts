import { contactDisplayLabel } from "@/lib/contacts/display";
import type { IntelligenceNextStep } from "@/lib/intelligence";
import {
  recommendContactChannel,
  type ContactChannelRecommendation,
} from "./contact-channel";

export const NEXT_ACTION_TITLES: Record<IntelligenceNextStep, string> = {
  PREPARE_OUTREACH: "Kontaktaufnahme vorbereiten",
  SEND_CONTENT: "Passenden Content senden",
  CONTACT_EXISTING: "Passenden Ansprechpartner kontaktieren",
  CHECK_FOLLOW_UP: "Follow-up durchführen",
};

export type NextActionContact = {
  id: string;
  fullName: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
};

export type NextActionSuggestion = {
  nextStep: IntelligenceNextStep;
  title: string;
  contact: NextActionContact | null;
  contactLabel: string | null;
  channel: ContactChannelRecommendation;
};

export type NextActionDraft = {
  title: string;
  contactId: string;
  channelHint: string | null;
};

export function preferPhoneForNextStep(nextStep: IntelligenceNextStep): boolean {
  return nextStep === "CONTACT_EXISTING" || nextStep === "CHECK_FOLLOW_UP" || nextStep === "PREPARE_OUTREACH";
}

export function buildNextAction(input: {
  nextStep?: IntelligenceNextStep | null;
  contact?: NextActionContact | null;
  allowedContactIds: Iterable<string>;
}): NextActionSuggestion | null {
  if (!input.nextStep) return null;

  const allowed = new Set(input.allowedContactIds);
  const contact =
    input.contact && allowed.has(input.contact.id) ? input.contact : null;

  return {
    nextStep: input.nextStep,
    title: NEXT_ACTION_TITLES[input.nextStep],
    contact,
    contactLabel: contact ? contactDisplayLabel(contact) : null,
    channel: recommendContactChannel(contact, {
      preferPhone: preferPhoneForNextStep(input.nextStep),
    }),
  };
}

export function todoDraftFromNextAction(action: NextActionSuggestion): NextActionDraft {
  return {
    title: action.title,
    contactId: action.contact?.id ?? "",
    channelHint: action.channel.label,
  };
}
