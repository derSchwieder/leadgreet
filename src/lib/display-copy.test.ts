import { describe, expect, it } from "vitest";
import { displayOpportunityTitle, localizeVisibleCopy } from "./display-copy";

describe("localizeVisibleCopy", () => {
  it("translates the demo playbook and why-now scoring copy", () => {
    const source =
      "The triggering signal is current (under 30 days). Signal is less than 7 days old (3 days). DATA PLATFORM has a base strength of 84. A named contact exists for this account.";
    expect(localizeVisibleCopy(source)).toBe(
      "Das auslösende Signal ist aktuell (unter 30 Tagen). Das Signal ist 3 Tage alt. Datenplattform hat eine Signalstärke von 84. Für diesen Account ist ein Ansprechpartner hinterlegt.",
    );

    expect(
      localizeVisibleCopy(
        "Demo playbook: confirm the signal with the listed contact, qualify budget owner, and decide whether to open a discovery conversation. This text is generated, not company-specific advice based on real events.",
      ),
    ).toContain("Demo-Leitfaden:");
  });
});

describe("displayOpportunityTitle", () => {
  it("replaces English signal-type suffixes", () => {
    expect(displayOpportunityTitle("Schaeffler — DATA PLATFORM")).toBe(
      "Schaeffler — Datenplattform",
    );
  });
});
