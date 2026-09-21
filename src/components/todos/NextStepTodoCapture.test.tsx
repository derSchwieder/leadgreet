import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { NextStepTodoCapture } from "./NextStepTodoCapture";

describe("NextStepTodoCapture", () => {
  it("offers creating a todo from the current next step", () => {
    const html = renderToStaticMarkup(
      <NextStepTodoCapture
        opportunityId="opp-1"
        companyId="co-1"
        nextStep="SEND_CONTENT"
      />,
    );

    expect(html).toContain("Als To-do anlegen");
    expect(html).not.toContain("accountId");
  });
});
