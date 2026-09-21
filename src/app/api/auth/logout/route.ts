import { logoutCurrentSession } from "@/lib/auth/login";
import { errorResponse, json, requireDatabase } from "@/lib/api";
import { applyClearedSessionCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    requireDatabase();
    await logoutCurrentSession();
    const response = json({ ok: true });
    applyClearedSessionCookie(response);
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
