import { PrismaClient } from "@prisma/client";
import { scoreOpportunity, scoreFreshness, scoreSignalStrength } from "../src/lib/scoring";
import { ensureDemoUser } from "../src/lib/db/users";
import { isMissingSignalFeedbackTable } from "../src/lib/db/signal-feedback";
import {
  SEED_COMPANY_LOCATIONS,
  SEED_COMPANY_NAMES,
  SEED_CONTACTS,
  SEED_CONTENT,
  SEED_DISCLAIMER,
  SEED_SERVICES,
  SEED_SIGNALS,
  SEED_SOURCES,
} from "./seed-data";

const prisma = new PrismaClient();

function daysAgo(days: number, now: Date): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function atDay(year: number, month: number, day: number, hour = 9): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, 0, 0));
}

async function seedDemoWorkbench(accountId: string): Promise<{
  activities: number;
  statusHistory: number;
}> {
  await prisma.activity.updateMany({
    where: { accountId },
    data: { responseToActivityId: null },
  });
  await prisma.activity.deleteMany({ where: { accountId } });
  await prisma.opportunityStatusHistory.deleteMany({ where: { accountId } });

  const opportunities = await prisma.opportunity.findMany({
    where: { accountId, isSeed: true },
    include: { recommendedContact: true },
    orderBy: { opportunityScore: "desc" },
    take: 2,
  });

  const primary = opportunities[0];
  const secondary = opportunities[1];
  if (!primary) {
    return { activities: 0, statusHistory: 0 };
  }

  const email = await prisma.activity.create({
    data: {
      accountId,
      opportunityId: primary.id,
      companyId: primary.companyId,
      contactId: primary.recommendedContactId,
      type: "EMAIL_SENT",
      subject: "Erstansprache",
      note: "Kurze Erstansprache zum aktuellen Signal. Keine automatische Sequence.",
      occurredAt: atDay(2026, 9, 12, 8),
      outcome: "NO_RESPONSE",
      outcomeNote: "Keine Reaktion — das ist ein gespeichertes Ergebnis, kein fehlender Datensatz.",
    },
  });

  const followUp = await prisma.activity.create({
    data: {
      accountId,
      opportunityId: primary.id,
      companyId: primary.companyId,
      contactId: primary.recommendedContactId,
      type: "FOLLOW_UP",
      subject: "Follow-up nach Erstansprache",
      note: "Keine Antwort auf die Erstansprache.",
      occurredAt: atDay(2026, 9, 16, 9),
      outcome: "NO_RESPONSE",
      responseToActivityId: email.id,
    },
  });

  const callback = await prisma.activity.create({
    data: {
      accountId,
      opportunityId: primary.id,
      companyId: primary.companyId,
      contactId: primary.recommendedContactId,
      type: "CALL",
      subject: "Rückruf des Kunden",
      note: "Kunde hat nach dem Follow-up zurückgerufen.",
      occurredAt: atDay(2026, 9, 20, 10),
      outcome: "CALLBACK_RECEIVED",
      responseToActivityId: followUp.id,
    },
  });

  await prisma.activity.create({
    data: {
      accountId,
      opportunityId: primary.id,
      companyId: primary.companyId,
      contactId: primary.recommendedContactId,
      type: "CALL",
      subject: "Telefonat mit Ansprechpartner",
      note: "Gespräch zum aktuellen Vorhaben; Interesse bestätigt.",
      occurredAt: atDay(2026, 9, 20, 11),
      outcome: "INTERESTED",
      responseToActivityId: callback.id,
    },
  });

  await prisma.activity.create({
    data: {
      accountId,
      opportunityId: primary.id,
      companyId: primary.companyId,
      contactId: primary.recommendedContactId,
      type: "MEETING",
      subject: "Termin zur weiteren Abstimmung",
      note: "Nächstes Gespräch vereinbart.",
      occurredAt: atDay(2026, 9, 20, 14),
      outcome: "MEETING_AGREED",
    },
  });

  const historyRows: Array<{
    opportunityId: string;
    fromStatus: "NEW" | "CONTACTED" | "MEETING" | null;
    toStatus: "NEW" | "CONTACTED" | "MEETING";
    note: string;
    changedAt: Date;
  }> = [
    {
      opportunityId: primary.id,
      fromStatus: null,
      toStatus: "NEW",
      note: "Opportunity angelegt",
      changedAt: atDay(2026, 9, 11, 7),
    },
    {
      opportunityId: primary.id,
      fromStatus: "NEW",
      toStatus: "CONTACTED",
      note: "Erstansprache versendet",
      changedAt: atDay(2026, 9, 12, 8),
    },
    {
      opportunityId: primary.id,
      fromStatus: "CONTACTED",
      toStatus: "MEETING",
      note: "Termin vereinbart — nur Historie, keine automatische Statuslogik.",
      changedAt: atDay(2026, 9, 20, 14),
    },
  ];

  if (secondary) {
    const secondEmail = await prisma.activity.create({
      data: {
        accountId,
        opportunityId: secondary.id,
        companyId: secondary.companyId,
        contactId: secondary.recommendedContactId,
        type: "EMAIL_SENT",
        subject: "Kurzvorstellung",
        occurredAt: atDay(2026, 9, 10, 8),
        outcome: "NO_RESPONSE",
      },
    });

    const missedCall = await prisma.activity.create({
      data: {
        accountId,
        opportunityId: secondary.id,
        companyId: secondary.companyId,
        contactId: secondary.recommendedContactId,
        type: "CALL",
        subject: "Nachfassanruf",
        occurredAt: atDay(2026, 9, 14, 10),
        outcome: "NOT_REACHABLE",
        responseToActivityId: secondEmail.id,
      },
    });

    await prisma.activity.create({
      data: {
        accountId,
        opportunityId: secondary.id,
        companyId: secondary.companyId,
        contactId: secondary.recommendedContactId,
        type: "NOTE",
        subject: "Interne Notiz",
        note: "Noch kein Gespräch zustande gekommen.",
        occurredAt: atDay(2026, 9, 14, 11),
      },
    });

    const later = await prisma.activity.create({
      data: {
        accountId,
        opportunityId: secondary.id,
        companyId: secondary.companyId,
        contactId: secondary.recommendedContactId,
        type: "FOLLOW_UP",
        subject: "Wiedervorlage",
        occurredAt: atDay(2026, 9, 18, 9),
        outcome: "FOLLOW_UP_LATER",
        responseToActivityId: missedCall.id,
      },
    });

    await prisma.activity.create({
      data: {
        accountId,
        opportunityId: secondary.id,
        companyId: secondary.companyId,
        contactId: secondary.recommendedContactId,
        type: "EMAIL_RECEIVED",
        subject: "Antwort des Kunden",
        occurredAt: atDay(2026, 9, 19, 15),
        outcome: "RESPONSE_RECEIVED",
        responseToActivityId: later.id,
      },
    });

    historyRows.push(
      {
        opportunityId: secondary.id,
        fromStatus: null,
        toStatus: "NEW",
        note: "Opportunity angelegt",
        changedAt: atDay(2026, 9, 9, 7),
      },
      {
        opportunityId: secondary.id,
        fromStatus: "NEW",
        toStatus: "CONTACTED",
        note: "Erstkontakt aufgenommen",
        changedAt: atDay(2026, 9, 10, 8),
      },
    );
  }

  await prisma.opportunityStatusHistory.createMany({
    data: historyRows.map((row) => ({
      accountId,
      opportunityId: row.opportunityId,
      fromStatus: row.fromStatus,
      toStatus: row.toStatus,
      note: row.note,
      changedAt: row.changedAt,
    })),
  });

  const [activities, statusHistory] = await Promise.all([
    prisma.activity.count({ where: { accountId } }),
    prisma.opportunityStatusHistory.count({ where: { accountId } }),
  ]);

  return { activities, statusHistory };
}

async function main() {
  const now = new Date();

  const demoAccount = await prisma.account.upsert({
    where: { slug: "demo" },
    update: { name: "Demo Account" },
    create: { name: "Demo Account", slug: "demo" },
  });
  const demoUser = await ensureDemoUser(demoAccount.id, prisma);

  await prisma.activity.updateMany({
    where: { accountId: demoAccount.id },
    data: { responseToActivityId: null },
  });
  await prisma.activity.deleteMany({ where: { accountId: demoAccount.id } });
  await prisma.opportunityStatusHistory.deleteMany({ where: { accountId: demoAccount.id } });
  await prisma.signalFeedback.deleteMany({ where: { accountId: demoAccount.id } }).catch((error) => {
    if (!isMissingSignalFeedbackTable(error)) throw error;
  });

  await prisma.scoreBreakdown.deleteMany({
    where: { opportunity: { isSeed: true } },
  });
  await prisma.opportunity.deleteMany({ where: { isSeed: true } });
  await prisma.signal.deleteMany({ where: { isSeed: true } });
  await prisma.contact.deleteMany({ where: { isSeed: true } });
  await prisma.source.deleteMany({ where: { isSeed: true } });
  await prisma.company.deleteMany({ where: { isSeed: true } });

  await prisma.contentItem.deleteMany({ where: { accountId: demoAccount.id } });
  await prisma.service.deleteMany({
    where: {
      accountId: demoAccount.id,
      name: { in: SEED_SERVICES.map((service) => service.name) },
    },
  });
  await prisma.service.createMany({
    data: SEED_SERVICES.map((service) => ({
      accountId: demoAccount.id,
      name: service.name,
      description: service.description,
      targetIndustries: service.targetIndustries,
      targetCompanySizes: service.targetCompanySizes,
      targetRoles: service.targetRoles,
      matchingSignalTypes: service.matchingSignalTypes,
      businessCaseTypes: service.businessCaseTypes,
      valuePropositions: service.valuePropositions,
      conversationStarter: service.conversationStarter,
      isActive: true,
    })),
  });

  const demoServices = await prisma.service.findMany({
    where: { accountId: demoAccount.id },
    select: { id: true, name: true },
  });
  const serviceIdByName = new Map(demoServices.map((service) => [service.name, service.id]));
  for (const spec of SEED_CONTENT) {
    const serviceIds = spec.serviceNames.map((name) => {
      const id = serviceIdByName.get(name);
      if (!id) throw new Error(`Missing demo service for content ${spec.name}: ${name}`);
      return { id };
    });
    await prisma.contentItem.create({
      data: {
        accountId: demoAccount.id,
        name: spec.name,
        description: spec.description,
        type: spec.type,
        tags: spec.tags,
        businessCaseTypes: spec.businessCaseTypes,
        targetRoles: spec.targetRoles,
        targetCompanySizes: spec.targetCompanySizes,
        isActive: true,
        services: { connect: serviceIds },
      },
    });
  }

  const companies = await Promise.all(
    SEED_COMPANY_NAMES.map((name) =>
      prisma.company.create({
        data: {
          name,
          city: SEED_COMPANY_LOCATIONS[name].city,
          country: SEED_COMPANY_LOCATIONS[name].country,
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
        accountId: demoAccount.id,
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

  const workbench = await seedDemoWorkbench(demoAccount.id);

  console.log(
    `Seed complete: ${companies.length} companies, ${createdSignals.length} signals, ${SEED_CONTACTS.length} contacts, ${SEED_SERVICES.length} services, ${SEED_CONTENT.length} content items, ${workbench.activities} activities, ${workbench.statusHistory} status-history rows, demo user ${demoUser.email}.`,
  );
}

export { seedDemoWorkbench };

const isDirectRun = process.argv[1]?.includes("seed.ts") ?? false;
if (isDirectRun) {
  main()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
