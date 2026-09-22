import { errorResponse, json, requireDatabase } from "@/lib/api";
import { getCurrentUser } from "@/lib/db/current-user";
import {
  getSignalFeedback,
  listSignalFeedbackForCompany,
  upsertSignalFeedback,
} from "@/lib/db/signal-feedback";
import { UnauthorizedError } from "@/lib/db/serialize";
import { upsertSignalFeedbackSchema } from "@/lib/validation";
import type { SignalFeedbackReason } from "@/types";

export const dynamic = "force-dynamic";

async function requireIdentity() {
  const user = await getCurrentUser();
  if (!user?.id || !user.accountId) {
    throw new UnauthorizedError();
  }
  return user;
}

export async function GET(request: Request) {
  try {
    requireDatabase();
    const user = await requireIdentity();
    const { searchParams } = new URL(request.url);
    const signalId = searchParams.get("signalId")?.trim() || undefined;
    const companyId = searchParams.get("companyId")?.trim() || undefined;

    if (signalId) {
      const feedback = await getSignalFeedback(user.accountId, user.id, signalId);
      return json({ feedback });
    }

    if (companyId) {
      const feedback = await listSignalFeedbackForCompany(user.accountId, user.id, companyId);
      return json({ feedback });
    }

    return json({ error: "signalId or companyId is required" }, 400);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    requireDatabase();
    const user = await requireIdentity();
    const body: unknown = await request.json();
    const input = upsertSignalFeedbackSchema.parse(body);
    const feedback = await upsertSignalFeedback(user.accountId, user.id, {
      signalId: input.signalId,
      relevant: input.relevant,
      reason: input.reason as SignalFeedbackReason | null,
    });
    return json({ feedback });
  } catch (error) {
    return errorResponse(error);
  }
}
