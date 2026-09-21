import { clientIpFromRequest } from "@/lib/auth/rate-limit";
import { requestLoginOtp } from "@/lib/auth/login";
import { errorResponse, json, requireDatabase } from "@/lib/api";
import { requestLoginOtpSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    requireDatabase();
    const body: unknown = await request.json();
    const input = requestLoginOtpSchema.parse(body);
    const result = await requestLoginOtp({
      email: input.email,
      ip: clientIpFromRequest(request),
    });
    return json({ ok: true, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}
