import type { Prisma, Source } from "@prisma/client";
import type { SourceType } from "@/types";
import { prisma } from "./client";
import { NotFoundError } from "./serialize";

export interface CreateSourceInput {
  name: string;
  url?: string | null;
  sourceType: SourceType;
  publishedAt?: Date | null;
  accessedAt?: Date | null;
  credibilityScore?: number;
  isSeed?: boolean;
}

export async function listSources(): Promise<Source[]> {
  return prisma.source.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getSourceById(id: string): Promise<Source> {
  const row = await prisma.source.findUnique({ where: { id } });
  if (!row) {
    throw new NotFoundError("Source", id);
  }
  return row;
}

export async function createSource(input: CreateSourceInput): Promise<Source> {
  return prisma.source.create({
    data: input as Prisma.SourceCreateInput,
  });
}
