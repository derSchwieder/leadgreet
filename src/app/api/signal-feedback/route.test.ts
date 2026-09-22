import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnauthorizedError } from "@/lib/db/serialize";

const { getCurrentUser, getSignalFeedback, listSignalFeedbackForCompany, upsertSignalFeedback } =
  vi.hoisted(() => ({
    getCurrentUser: vi.fn(),
    getSignalFeedback: vi.fn(),
    listSignalFeedbackForCompany: vi.fn(),
    upsertSignalFeedback: vi.fn(),
  }));

vi.mock("@/lib/db/current-user", () => ({
  getCurrentUser,
}));

vi.mock("@/lib/db/signal-feedback", () => ({
  getSignalFeedback,
  listSignalFeedbackForCompany,
  upsertSignalFeedback,
}));

import { GET, PUT } from "./route";

const identity = {
  id: "user-a",
  accountId: "account-a",
  name: "Ada",
  email: "ada@leadgreet.test",
};

describe("/api/signal-feedback", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
    getSignalFeedback.mockReset();
    listSignalFeedbackForCompany.mockReset();
    upsertSignalFeedback.mockReset();
    getCurrentUser.mockResolvedValue(identity);
  });

  it("H: rejects unauthenticated access", async () => {
    getCurrentUser.mockRejectedValue(new UnauthorizedError());

    const response = await PUT(
      new Request("http://localhost/api/signal-feedback", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signalId: "sig-1", relevant: true }),
      }),
    );

    expect(response.status).toBe(401);
    expect(upsertSignalFeedback).not.toHaveBeenCalled();
  });

  it("saves feedback for the current account and ignores a client tenant override", async () => {
    upsertSignalFeedback.mockResolvedValue({
      id: "fb-1",
      signalId: "sig-1",
      accountId: "account-a",
      userId: "user-a",
      relevant: true,
      reason: null,
    });

    const response = await PUT(
      new Request("http://localhost/api/signal-feedback", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signalId: "sig-1",
          relevant: true,
          accountId: "account-other",
          userId: "user-other",
          greetScore: 12,
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(upsertSignalFeedback).toHaveBeenCalledWith("account-a", "user-a", {
      signalId: "sig-1",
      relevant: true,
      reason: null,
    });
    expect(body.feedback.accountId).toBe("account-a");
  });

  it("loads the current user's feedback for a signal", async () => {
    getSignalFeedback.mockResolvedValue({
      id: "fb-1",
      signalId: "sig-1",
      relevant: false,
      reason: "TOO_OLD",
    });

    const response = await GET(new Request("http://localhost/api/signal-feedback?signalId=sig-1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getSignalFeedback).toHaveBeenCalledWith("account-a", "user-a", "sig-1");
    expect(body.feedback.reason).toBe("TOO_OLD");
  });

  it("loads company feedback only for the current identity", async () => {
    listSignalFeedbackForCompany.mockResolvedValue([]);
    const response = await GET(
      new Request("http://localhost/api/signal-feedback?companyId=co-1"),
    );
    expect(response.status).toBe(200);
    expect(listSignalFeedbackForCompany).toHaveBeenCalledWith("account-a", "user-a", "co-1");
  });
});
