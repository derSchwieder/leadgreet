import { completeLogin } from "@/lib/auth/login";
import { clientIpFromRequest } from "@/lib/auth/rate-limit";
import { errorResponse, json, requireDatabase } from "@/lib/api";
import { applySessionCookie } from "@/lib/session";
import { verifyLoginOtpSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    requireDatabase();
    const body: unknown = await request.json();
    const input = verifyLoginOtpSchema.parse(body);
    const result = await completeLogin({
      email: input.email,
      otp: input.otp,
      ip: clientIpFromRequest(request),
    });

    if (!result.ok) {
      return json({ error: result.message }, 401);
    }

    const response = json({ ok: true });
    applySessionCookie(response, result.session.token, result.session.expiresAt);
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
