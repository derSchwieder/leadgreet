import { describe, expect, it } from "vitest";
import { recommendContactChannel } from "./contact-channel";

describe("recommendContactChannel", () => {
  it("recommends phone when a phone number is present", () => {
    const result = recommendContactChannel({ phone: "+49 123" });
    expect(result.label).toBe("Telefon");
    expect(result.channels).toEqual(["phone"]);
    expect(result.missingPhone).toBe(false);
  });

  it("recommends phone and email when both are present", () => {
    const result = recommendContactChannel({
      phone: "+49 123",
      email: "cdo@example.com",
    });
    expect(result.label).toBe("Telefon + E-Mail");
    expect(result.channels).toEqual(["phone", "email"]);
  });

  it("recommends email when only email is present", () => {
    const result = recommendContactChannel({ email: "cdo@example.com" });
    expect(result.label).toBe("E-Mail");
    expect(result.channels).toEqual(["email"]);
  });

  it("recommends LinkedIn when only LinkedIn is present", () => {
    const result = recommendContactChannel({ linkedinUrl: "https://linkedin.com/in/cdo" });
    expect(result.label).toBe("LinkedIn");
    expect(result.channels).toEqual(["linkedin"]);
  });

  it("asks to research contact details when none are present", () => {
    const result = recommendContactChannel({ email: null, phone: null, linkedinUrl: null });
    expect(result.label).toBe("Kontaktdaten recherchieren");
    expect(result.channels).toEqual([]);
  });

  it("keeps phone first when a direct contact is preferred but the number is missing", () => {
    const result = recommendContactChannel(
      { email: "cdo@example.com" },
      { preferPhone: true },
    );
    expect(result.label).toBe("Telefon + E-Mail");
    expect(result.missingPhone).toBe(true);
    expect(result.researchPhoneHint).toBe(true);
    expect(result.reason).toContain("Telefonnummer ist aktuell nicht hinterlegt");
    expect(result.reason).not.toMatch(/CIO|lesen E-Mails/i);
  });
});
