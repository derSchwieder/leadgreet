import { describe, expect, it } from "vitest";
import {
  activityLabelFromNextStep,
  activityTypeFromNextStep,
  nextStepDescription,
} from "./from-next-step";

describe("activityTypeFromNextStep", () => {
  it("maps each next step to the matching activity type and German label", () => {
    expect(activityTypeFromNextStep("SEND_CONTENT")).toBe("EMAIL_SENT");
    expect(activityLabelFromNextStep("SEND_CONTENT")).toBe("E-Mail gesendet");
    expect(nextStepDescription("SEND_CONTENT")).toBe("Passenden Inhalt senden");

    expect(activityTypeFromNextStep("CONTACT_EXISTING")).toBe("CALL");
    expect(activityLabelFromNextStep("CONTACT_EXISTING")).toBe("Anruf");

    expect(activityTypeFromNextStep("CHECK_FOLLOW_UP")).toBe("FOLLOW_UP");
    expect(activityLabelFromNextStep("CHECK_FOLLOW_UP")).toBe("Follow-up");

    expect(activityTypeFromNextStep("PREPARE_OUTREACH")).toBe("NOTE");
    expect(activityLabelFromNextStep("PREPARE_OUTREACH")).toBe("Notiz");
  });
});
