import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EmailDraftView } from "./EmailDraftPanel";
import { composeEmailDraft } from "@/lib/email";
import type { EmailDraftInput } from "@/lib/email";

function input(): EmailDraftInput {
  return {
    companyName: "Goldhofer",
    recommendedContact: { firstName: "Stefan" },
    primaryServiceRecommendation: {
      name: "Cloud Migration",
      valuePropositions: ["Skalierbare Kapazität in der Cloud bereitstellen"],
      conversationStarter: "Zur laufenden Cloud- oder Modernisierungsinitiative können wir den Umfang eingrenzen.",
    },
    primaryBusinessCase: {
      type: "CAPACITY",
      reasons: ["Cloud-Migration kann auf den Bedarf nach skalierbarer Kapazität hindeuten."],
      supportingSignals: ["[DEMO] Cloud migration scoping"],
      valuePropositions: ["Skalierbare Kapazität in der Cloud bereitstellen"],
    },
    supportingSignals: [{ type: "CLOUD_MIGRATION", title: "[DEMO] Cloud migration scoping" }],
  };
}

describe("EmailDraftView", () => {
  it("renders subject, message, service and draft basis", () => {
    const draft = composeEmailDraft(input());
    const html = renderToStaticMarkup(<EmailDraftView draft={draft} />);
    expect(html).toContain("Betreff");
    expect(html).toContain("Zusätzliche Kapazität für Goldhofer");
    expect(html).toContain("Nachricht");
    expect(html).toContain("Hallo Stefan");
    expect(html).toContain("Cloud-Migration");
    expect(html).toContain("Skalierbare Kapazität in der Cloud bereitstellen");
    expect(html).toContain("Cloud Migration");
    expect(html).toContain("Grundlage des Entwurfs");
    expect(html).toContain("Kapazität schaffen");
    expect(html).not.toMatch(/500\.000|20\s*%|€/);
  });

  it("does not invent a person or business case in the preview", () => {
    const draft = composeEmailDraft({
      companyName: "SAF-HOLLAND",
      recommendedContact: null,
      primaryServiceRecommendation: null,
      primaryBusinessCase: null,
      supportingSignals: [{ type: "NEW_CIO", title: "[DEMO] Leadership change — CIO role" }],
    });
    const html = renderToStaticMarkup(<EmailDraftView draft={draft} />);
    expect(html).toContain("Hallo,");
    expect(html).not.toContain("Frau");
    expect(html).toContain("kein belastbarer Business Case");
    expect(html).not.toContain("Kosten senken");
  });
});
