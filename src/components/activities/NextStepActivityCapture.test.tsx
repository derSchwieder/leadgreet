import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { NextStepActivityCapture } from "./NextStepActivityCapture";

describe("NextStepActivityCapture", () => {
  it("offers capture from the current next step", () => {
    const html = renderToStaticMarkup(
      <NextStepActivityCapture
        opportunityId="opp-1"
        companyId="co-1"
        nextStep="SEND_CONTENT"
      />,
    );

    expect(html).toContain("Als Aktivität erfassen");
    expect(html).not.toContain("accountId");
  });
});
