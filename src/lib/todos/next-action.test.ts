import { describe, expect, it } from "vitest";
import { buildNextAction, todoDraftFromNextAction } from "./next-action";

const seedCdo = {
  id: "c-cdo",
  fullName: "Seed CDO",
  role: "CDO",
  email: "cdo@example.com",
  phone: null,
  linkedinUrl: null,
};

describe("buildNextAction", () => {
  it("maps CONTACT_EXISTING to a contact outreach suggestion", () => {
    const action = buildNextAction({
      nextStep: "CONTACT_EXISTING",
      contact: seedCdo,
      allowedContactIds: ["c-cdo"],
    });

    expect(action?.title).toBe("Passenden Ansprechpartner kontaktieren");
    expect(action?.contactLabel).toBe("Seed CDO · CDO");
    expect(action?.channel.label).toBe("Telefon + E-Mail");
    expect(action?.channel.researchPhoneHint).toBe(true);
  });

  it("maps SEND_CONTENT to the existing next-step suggestion", () => {
    const action = buildNextAction({
      nextStep: "SEND_CONTENT",
      contact: { ...seedCdo, phone: "+49 123" },
      allowedContactIds: ["c-cdo"],
    });
    expect(action?.title).toBe("Passenden Content senden");
    expect(action?.channel.label).toBe("Telefon + E-Mail");
  });

  it("maps remaining intelligence next steps to their suggestion titles", () => {
    expect(
      buildNextAction({
        nextStep: "CHECK_FOLLOW_UP",
        contact: seedCdo,
        allowedContactIds: ["c-cdo"],
      })?.title,
    ).toBe("Follow-up durchführen");
    expect(
      buildNextAction({
        nextStep: "PREPARE_OUTREACH",
        contact: seedCdo,
        allowedContactIds: ["c-cdo"],
      })?.title,
    ).toBe("Kontaktaufnahme vorbereiten");
  });

  it("does not attach a foreign contact to the suggestion or draft", () => {
    const action = buildNextAction({
      nextStep: "CONTACT_EXISTING",
      contact: { ...seedCdo, id: "c-foreign" },
      allowedContactIds: ["c-cdo"],
    });

    expect(action?.contact).toBeNull();
    expect(action?.contactLabel).toBeNull();
    expect(todoDraftFromNextAction(action!).contactId).toBe("");
    expect(todoDraftFromNextAction(action!).title).toBe("Passenden Ansprechpartner kontaktieren");
  });

  it("returns null when intelligence has no next step", () => {
    expect(
      buildNextAction({
        nextStep: null,
        contact: seedCdo,
        allowedContactIds: ["c-cdo"],
      }),
    ).toBeNull();
  });

  it("pre-fills the existing todo draft from the suggestion", () => {
    const action = buildNextAction({
      nextStep: "CONTACT_EXISTING",
      contact: seedCdo,
      allowedContactIds: ["c-cdo"],
    });
    expect(todoDraftFromNextAction(action!)).toEqual({
      title: "Passenden Ansprechpartner kontaktieren",
      contactId: "c-cdo",
      channelHint: "Telefon + E-Mail",
    });
  });
});
