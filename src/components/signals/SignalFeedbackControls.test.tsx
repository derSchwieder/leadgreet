import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SignalFeedbackControls } from "./SignalFeedbackControls";

describe("SignalFeedbackControls", () => {
  it("asks whether the signal is relevant", () => {
    const html = renderToStaticMarkup(<SignalFeedbackControls signalId="sig-1" />);
    expect(html).toContain("Ist dieses Signal für dich relevant?");
    expect(html).toContain("Relevant");
    expect(html).toContain("Nicht relevant");
    expect(html).not.toContain("Zu alt");
  });

  it("shows optional reasons after a rating is stored", () => {
    const html = renderToStaticMarkup(
      <SignalFeedbackControls signalId="sig-1" initial={{ relevant: false, reason: "TOO_OLD" }} />,
    );
    expect(html).toContain("Zu alt");
    expect(html).toContain("Kein konkreter Bedarf");
    expect(html).not.toContain("Guter Vertriebsanlass");
  });
});
