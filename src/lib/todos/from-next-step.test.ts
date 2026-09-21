import { describe, expect, it } from "vitest";
import { todoTitleFromNextStep } from "./from-next-step";

describe("todoTitleFromNextStep", () => {
  it("uses the existing next-step label as todo title", () => {
    expect(todoTitleFromNextStep("SEND_CONTENT")).toBe("Passenden Inhalt senden");
  });
});
