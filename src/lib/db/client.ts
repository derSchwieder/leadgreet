import { createRequire } from "node:module";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(url && url.trim().length > 0);
}

export async function isDatabaseReachable(): Promise<boolean> {
  if (!isDatabaseConfigured()) {
    return false;
  }

  try {
    await Promise.race([
      getPrisma().$queryRaw`SELECT 1`,
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("database connection timeout")), 10000);
      }),
    ]);
    return true;
  } catch {
    return false;
  }
}

function hasDelegate(client: PrismaClient, name: "contentItem" | "salesTodo" | "signalFeedback"): boolean {
  const delegate = (client as unknown as Record<string, { findMany?: unknown } | undefined>)[name];
  return typeof delegate?.findMany === "function";
}

function hasRequiredModels(client: PrismaClient): boolean {
  return (
    hasDelegate(client, "contentItem") &&
    hasDelegate(client, "salesTodo") &&
    hasDelegate(client, "signalFeedback")
  );
}

function prismaClientOptions(): ConstructorParameters<typeof PrismaClient>[0] {
  return {
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  };
}

function loadGeneratedPrismaClient(): PrismaClient {
  const req = createRequire(join(process.cwd(), "package.json"));
  for (const id of Object.keys(req.cache)) {
    if (id.includes("@prisma/client") || id.includes(".prisma/client")) {
      delete req.cache[id];
    }
  }
  const generated = req("@prisma/" + "client") as { PrismaClient: typeof PrismaClient };
  return new generated.PrismaClient(prismaClientOptions());
}

function createPrismaClient(): PrismaClient {
  const imported = new PrismaClient(prismaClientOptions());
  if (hasRequiredModels(imported)) {
    return imported;
  }
  void imported.$disconnect();
  const generated = loadGeneratedPrismaClient();
  if (!hasRequiredModels(generated)) {
    void generated.$disconnect();
    throw new Error(
      "Prisma Client is missing ContentItem, SalesTodo, or SignalFeedback. Run `npx prisma generate` and restart the Next.js server.",
    );
  }
  return generated;
}

export function getPrisma(): PrismaClient {
  if (!isDatabaseConfigured()) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and provide a PostgreSQL connection string.",
    );
  }

  const existing = globalForPrisma.prisma;
  if (existing && !hasRequiredModels(existing)) {
    void existing.$disconnect();
    globalForPrisma.prisma = undefined;
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, client) as unknown;
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
