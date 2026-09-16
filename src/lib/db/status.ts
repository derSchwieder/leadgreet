import { isDatabaseConfigured, isDatabaseReachable } from "@/lib/db/client";

export async function getDatabaseGate(): Promise<"ready" | "missing" | "unreachable"> {
  if (!isDatabaseConfigured()) {
    return "missing";
  }
  const reachable = await isDatabaseReachable();
  return reachable ? "ready" : "unreachable";
}
