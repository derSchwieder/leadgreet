export type ContactChannelInput = {
  email?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
};

export type ContactChannelKind = "phone" | "email" | "linkedin";

export type ContactChannelRecommendation = {
  label: string;
  channels: ContactChannelKind[];
  missingPhone: boolean;
  researchPhoneHint: boolean;
  reason: string;
};

function hasValue(value: string | null | undefined): boolean {
  return Boolean(value && value.trim());
}

export function recommendContactChannel(
  contact: ContactChannelInput | null | undefined,
  options: { preferPhone?: boolean } = {},
): ContactChannelRecommendation {
  const phone = hasValue(contact?.phone);
  const email = hasValue(contact?.email);
  const linkedin = hasValue(contact?.linkedinUrl);
  const preferPhone = options.preferPhone === true;

  if (!phone && !email && !linkedin) {
    return {
      label: "Kontaktdaten recherchieren",
      channels: [],
      missingPhone: true,
      researchPhoneHint: false,
      reason: "Aktuell sind keine direkten Kontaktdaten hinterlegt.",
    };
  }

  if (phone && email) {
    return {
      label: "Telefon + E-Mail",
      channels: ["phone", "email"],
      missingPhone: false,
      researchPhoneHint: false,
      reason: "Eine Telefonnummer und eine E-Mail-Adresse sind hinterlegt.",
    };
  }

  if (phone && linkedin) {
    return {
      label: "Telefon + LinkedIn",
      channels: ["phone", "linkedin"],
      missingPhone: false,
      researchPhoneHint: false,
      reason: "Eine Telefonnummer und ein LinkedIn-Profil sind hinterlegt.",
    };
  }

  if (phone) {
    return {
      label: "Telefon",
      channels: ["phone"],
      missingPhone: false,
      researchPhoneHint: false,
      reason: "Eine Telefonnummer ist hinterlegt.",
    };
  }

  if (preferPhone && email) {
    return {
      label: "Telefon + E-Mail",
      channels: linkedin ? ["email", "linkedin"] : ["email"],
      missingPhone: true,
      researchPhoneHint: true,
      reason:
        "Leadgreet empfiehlt zunächst eine direkte telefonische Kontaktaufnahme. Eine Telefonnummer ist aktuell nicht hinterlegt. Deshalb zusätzlich per E-Mail ansprechen.",
    };
  }

  if (email && linkedin) {
    return {
      label: "E-Mail + LinkedIn",
      channels: ["email", "linkedin"],
      missingPhone: true,
      researchPhoneHint: false,
      reason: "Eine E-Mail-Adresse und ein LinkedIn-Profil sind hinterlegt.",
    };
  }

  if (email) {
    return {
      label: "E-Mail",
      channels: ["email"],
      missingPhone: true,
      researchPhoneHint: false,
      reason: "Eine E-Mail-Adresse ist hinterlegt.",
    };
  }

  return {
    label: "LinkedIn",
    channels: ["linkedin"],
    missingPhone: true,
    researchPhoneHint: false,
    reason: "Ein LinkedIn-Profil ist hinterlegt.",
  };
}
