import { PrismaClient } from "@prisma/client";
import { scoreOpportunity, scoreFreshness, scoreSignalStrength } from "../src/lib/scoring";
import {
  SEED_COMPANY_NAMES,
  SEED_CONTACTS,
  SEED_DISCLAIMER,
  SEED_SIGNALS,
  SEED_SOURCES,
} from "./seed-data";

const prisma = new PrismaClient();

function daysAgo(days: number, now: Date): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

async function main() {
  const now = new Date();

  await prisma.scoreBreakdown.deleteMany({
    where: { opportunity: { isSeed: true } },
  });
  await prisma.opportunity.deleteMany({ where: { isSeed: true } });
  await prisma.signal.deleteMany({ where: { isSeed: true } });
  await prisma.contact.deleteMany({ where: { isSeed: true } });
  await prisma.source.deleteMany({ where: { isSeed: true } });
  await prisma.company.deleteMany({ where: { isSeed: true } });

  const companies = await Promise.all(
    SEED_COMPANY_NAMES.map((name) =>
      prisma.company.create({
        data: {
          name,
          description: SEED_DISCLAIMER,
          isSeed: true,
        },
      }),
    ),
  );

  const companyByName = new Map(companies.map((company) => [company.name, company]));

  const sources = await Promise.all(
    SEED_SOURCES.map((source) =>
      prisma.source.create({
        data: {
          name: source.name,
          sourceType: source.sourceType,
          credibilityScore: source.credibilityScore,
          accessedAt: now,
          isSeed: true,
        },
      }),
    ),
  );

  const sourceByKey = new Map(SEED_SOURCES.map((spec, index) => [spec.key, sources[index]!]));

  const createdSignals = [];
  for (const spec of SEED_SIGNALS) {
    const company = companyByName.get(spec.companyName);
    const source = sourceByKey.get(spec.sourceKey);
    if (!company || !source) {
      throw new Error(`Missing company or source for signal ${spec.title}`);
    }

    const detectedAt = daysAgo(spec.daysAgo, now);
    const scoringSignal = {
      type: spec.type,
      detectedAt,
      eventDate: detectedAt,
      sourceType: source.sourceType,
      sourceCredibility: source.credibilityScore,
      sourceUrl: source.url,
      title: spec.title,
      description: spec.description,
    };
    const strength = scoreSignalStrength([scoringSignal]);
    const freshness = scoreFreshness([scoringSignal], now);

    const signal = await prisma.signal.create({
      data: {
        companyId: company.id,
        type: spec.type,
        title: spec.title,
        description: spec.description,
        detectedAt,
        eventDate: detectedAt,
        sourceId: source.id,
        sourceName: source.name,
        signalStrength: strength.score,
        freshnessScore: freshness.score,
        relevanceScore: Math.round(strength.score * 0.7 + freshness.score * 0.3),
        confidenceScore: source.credibilityScore,
        status: "NEW",
        isSeed: true,
      },
    });
    createdSignals.push(signal);
  }

  for (const spec of SEED_CONTACTS) {
    const company = companyByName.get(spec.companyName);
    if (!company) {
      throw new Error(`Missing company for contact ${spec.companyName}`);
    }
    await prisma.contact.create({
      data: {
        companyId: company.id,
        firstName: spec.firstName,
        lastName: spec.lastName,
        fullName: `${spec.firstName} ${spec.lastName}`,
        role: spec.role,
        department: "Seed / demo",
        confidenceScore: 40,
        isDecisionMaker: spec.isDecisionMaker,
        isSeed: true,
      },
    });
  }

  for (const company of companies) {
    const signals = createdSignals.filter((signal) => signal.companyId === company.id);
    const contact = await prisma.contact.findFirst({
      where: { companyId: company.id, isSeed: true },
    });
    const signalRecords = await prisma.signal.findMany({
      where: { companyId: company.id },
      include: { source: true },
    });

    const scored = scoreOpportunity({
      now,
      company: {
        industry: company.industry,
        subIndustry: company.subIndustry,
        country: company.country,
        employees: company.employees,
        companySize: company.companySize,
        website: company.website,
        city: company.city,
        revenue: company.revenue?.toString() ?? null,
      },
      signals: signalRecords.map((signal) => ({
        type: signal.type,
        detectedAt: signal.detectedAt,
        eventDate: signal.eventDate,
        sourceType: signal.source?.sourceType ?? null,
        sourceCredibility: signal.source?.credibilityScore ?? null,
        sourceUrl: signal.sourceUrl,
        title: signal.title,
        description: signal.description,
      })),
      contact: contact
        ? {
            role: contact.role,
            isDecisionMaker: contact.isDecisionMaker,
            confidenceScore: contact.confidenceScore,
            email: contact.email,
            linkedinUrl: contact.linkedinUrl,
            department: contact.department,
          }
        : null,
    });

    const primary = signals[0];
    await prisma.opportunity.create({
      data: {
        companyId: company.id,
        title: primary
          ? `${company.name} — ${primary.type.replaceAll("_", " ")}`
          : `${company.name} — demo opportunity`,
        description: SEED_DISCLAIMER,
        recommendedApproach:
          "Demo playbook: confirm the signal with the listed contact, qualify budget owner, and decide whether to open a discovery conversation. This text is generated, not company-specific advice based on real events.",
        whyNow: scored.whyNow,
        opportunityScore: scored.opportunityScore,
        signalStrength: scored.signalStrength,
        companyFit: scored.companyFit,
        contactFit: scored.contactFit,
        freshness: scored.freshness,
        confidence: scored.confidence,
        status: "NEW",
        recommendedContactId: contact?.id ?? null,
        isSeed: true,
        signals: {
          connect: signals.map((signal) => ({ id: signal.id })),
        },
        scoreBreakdown: {
          create: {
            signalStrength: scored.signalStrength,
            freshness: scored.freshness,
            companyFit: scored.companyFit,
            contactFit: scored.contactFit,
            confidence: scored.confidence,
            totalScore: scored.opportunityScore,
            explanation: scored.explanation,
          },
        },
      },
    });
  }

  console.log(
    `Seed complete: ${companies.length} companies, ${createdSignals.length} signals, ${SEED_CONTACTS.length} contacts (all isSeed=true).`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
