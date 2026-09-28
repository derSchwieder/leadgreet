import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DiscoveryCard } from "./DiscoveryCard";
import { DiscoveryDetail } from "./DiscoveryDetail";
import { DiscoveryInbox } from "./DiscoveryInbox";
import type { DiscoveryViewItem } from "./discovery-presentation";

const item: DiscoveryViewItem = {
  id: "disc-1",
  title: "Neue KI-Initiative",
  description: "Siemens baut seine Aktivitäten im Bereich Industrial AI weiter aus.",
  signalType: "AI_AGENT",
  source: "Presse",
  sourceUrl: "https://example.com/siemens",
  detectedAt: "2026-09-25T08:00:00.000Z",
  publishedAt: "2026-09-24T00:00:00.000Z",
  companyNameRaw: "Siemens",
  personNameRaw: null,
  domainRaw: "siemens.com",
  locationRaw: "München",
  status: "NEW",
  confidence: 87,
  resolvedCompany: null,
  resolvedContact: null,
};

describe("Discovery Inbox V1", () => {
  it("renders the inbox with NEW items and status filters", () => {
    const html = renderToStaticMarkup(
      <DiscoveryInbox initialItems={[item]} initialReviewedCount={2} availableTypes={["AI_AGENT"]} />,
    );
    expect(html).toContain("Neue KI-Initiative");
    expect(html).toContain("Siemens");
    expect(html).toContain("Industrial AI");
    expect(html).toContain("Confidence 87 %");
    expect(html).toContain("Prüfen");
    expect(html).toContain("Neu");
    expect(html).toContain("Geprüft");
    expect(html).toContain("Gelöst");
    expect(html).toContain("Ignoriert");
    expect(html).toContain(">2</span> geprüft");
    expect(html).toContain("KI-Agent");
  });

  it("shows the empty state when no NEW items exist", () => {
    const html = renderToStaticMarkup(
      <DiscoveryInbox initialItems={[]} initialReviewedCount={0} availableTypes={[]} />,
    );
    expect(html).toContain("Keine neuen Entdeckungen");
    expect(html).toContain("Aktuell liegen keine ungeprüften Signale vor.");
    expect(html).not.toContain("Neue KI-Initiative");
  });

  it("renders a compact discovery card", () => {
    const html = renderToStaticMarkup(
      <DiscoveryCard item={item} onOpen={() => undefined} onReview={() => undefined} />,
    );
    expect(html).toContain("Neue KI-Initiative");
    expect(html).toContain("Siemens");
    expect(html).toContain("Prüfen");
    expect(html).not.toContain("München");
  });

  it("renders the detail with entity fields and resolve actions", () => {
    const html = renderToStaticMarkup(
      <DiscoveryDetail
        item={item}
        pending={false}
        error={null}
        companyQuery=""
        companies={[]}
        selectedCompany={null}
        createName="Siemens"
        createDomain="siemens.com"
        dismissConfirm={false}
        onCompanyQueryChange={() => undefined}
        onSelectCompany={() => undefined}
        onCreateNameChange={() => undefined}
        onCreateDomainChange={() => undefined}
        onReview={() => undefined}
        onDismiss={() => undefined}
        onConfirmDismiss={() => undefined}
        onCancelDismiss={() => undefined}
        onResolveExisting={() => undefined}
        onResolveCreate={() => undefined}
      />,
    );
    expect(html).toContain("Entdeckung");
    expect(html).toContain("Erkannte Entity");
    expect(html).toContain("Unternehmen suchen…");
    expect(html).toContain("Signal übernehmen");
    expect(html).toContain("Neue Company anlegen");
    expect(html).toContain("Ignorieren");
    expect(html).toContain("siemens.com");
    expect(html).toContain("München");
  });

  it("shows a selected company and API errors", () => {
    const html = renderToStaticMarkup(
      <DiscoveryDetail
        item={{ ...item, status: "REVIEWED" }}
        pending
        error="Die Angaben sind unvollständig."
        companyQuery=""
        companies={[]}
        selectedCompany={{ id: "co-1", name: "Siemens AG", website: null }}
        createName=""
        createDomain=""
        dismissConfirm={false}
        onCompanyQueryChange={() => undefined}
        onSelectCompany={() => undefined}
        onCreateNameChange={() => undefined}
        onCreateDomainChange={() => undefined}
        onReview={() => undefined}
        onDismiss={() => undefined}
        onConfirmDismiss={() => undefined}
        onCancelDismiss={() => undefined}
        onResolveExisting={() => undefined}
        onResolveCreate={() => undefined}
      />,
    );
    expect(html).toContain("Siemens AG");
    expect(html).toContain("Signal übernehmen");
    expect(html).toContain("Die Angaben sind unvollständig.");
    expect(html).not.toContain("UnresolvedSignal");
    expect(html).toContain("disabled");
  });
});
