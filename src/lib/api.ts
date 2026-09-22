import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { isDatabaseConfigured } from "@/lib/db/client";
import { RateLimitError } from "@/lib/auth/rate-limit";
import { ConflictError, NotFoundError, UnauthorizedError } from "@/lib/db/serialize";

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

function isDatabaseConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { name?: string; code?: string; message?: string };
  if (candidate.name === "PrismaClientInitializationError") return true;
  if (candidate.code === "P1001" || candidate.code === "P1000" || candidate.code === "P1017") {
    return true;
  }
  return (
    typeof candidate.message === "string" &&
    /Can't reach database|ECONNREFUSED|database connection timeout|DATABASE_URL/i.test(
      candidate.message,
    )
  );
}

export function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (error instanceof ConflictError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  if (error instanceof RateLimitError) {
    return NextResponse.json({ error: error.message }, { status: 429 });
  }

  if (isDatabaseConnectionError(error)) {
    return NextResponse.json(
      { error: "Database is not reachable. Set DATABASE_URL and start PostgreSQL." },
      { status: 503 },
    );
  }

  console.error(error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export function requireDatabase() {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not set");
  }
}
