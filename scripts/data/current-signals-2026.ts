import type { SignalType, SourceType } from "@prisma/client";

/**
 * Current public 2026 signals for an existing sales-intelligence screening.
 * Copy is taken from the cited official pages. No invented URLs.
 * Companies are lookup keys: create only if missing, never overwrite seed rows.
 */
export type CurrentSignalSource = {
  name: string;
  url: string;
  sourceType: SourceType;
};

export type CurrentSignalCompany = {
  name: string;
  website: string;
  city: string;
  country: string;
  industry?: string;
  latitude?: number;
  longitude?: number;
  isSeed: false;
};

export type CurrentSignalRecord = {
  company: CurrentSignalCompany;
  title: string;
  description: string;
  type: SignalType;
  date: string;
  source: CurrentSignalSource;
};

export const CURRENT_SIGNALS_2026: CurrentSignalRecord[] = [
  {
    company: {
      name: "TeamViewer SE",
      website: "https://www.teamviewer.com",
      city: "Göppingen",
      country: "Deutschland",
      industry: "Software",
      latitude: 48.7054,
      longitude: 9.6511,
      isSeed: false,
    },
    title: "Automatisierung im IT-Support: TeamViewers KI-Agent Tia kann eigenständig IT-Probleme beheben",
    description:
      "TeamViewer hat heute die neue Funktion Tia Troubleshooting für seinen KI-Agent Tia vorgestellt, die dessen Fähigkeiten deutlich erweitert. Der KI-Agent kann während einer Fernwartungs-Session nun eigenständig Probleme analysieren, deren Ursache identifizieren, das Problem nach Freigabe durch eine IT-Fachkraft direkt auf dem Endgerät lösen und die Problembehebung anschließend validieren.",
    type: "AI_AGENT",
    date: "2026-09-08",
    source: {
      name: "TeamViewer",
      url: "https://www.teamviewer.com/de/global/company/press/2026/teamviewer-expands-ai-powered-it-troubleshooting-from-guidance-to-governed-action/",
      sourceType: "PRESS_RELEASE",
    },
  },
  {
    company: {
      name: "TeamViewer SE",
      website: "https://www.teamviewer.com",
      city: "Göppingen",
      country: "Deutschland",
      industry: "Software",
      latitude: 48.7054,
      longitude: 9.6511,
      isSeed: false,
    },
    title: "TeamViewer AI adoption grows ninefold in twelve months",
    description:
      "TeamViewer’s AI portfolio has seen strong growth over the past year. The number of customers that have used TeamViewer AI rose 9.1-fold, from 6,921 in September 2025 to 62,953 in September 2026. Session Insights generated 4,003,701 summaries by September 2026. Tia, the TeamViewer Intelligent Agent, has handled 32,068 interactions since its launch in November 2025.",
    type: "AI_STRATEGY",
    date: "2026-09-15",
    source: {
      name: "TeamViewer",
      url: "https://www.teamviewer.com/en/insights/teamviewer-ai-adoption-grows-ninefold-in-twelve-months/",
      sourceType: "NEWS",
    },
  },
  {
    company: {
      name: "Siemens AG",
      website: "https://www.siemens.com",
      city: "München",
      country: "Deutschland",
      industry: "Industrieautomation",
      latitude: 48.1374,
      longitude: 11.5755,
      isSeed: false,
    },
    title: "Siemens setzt neue Maßstäbe in der Ausbildung: KI-Kompetenz fest verankert",
    description:
      "Rund 1.500 junge Menschen starten in diesem Jahr ihre Ausbildung oder ihr duales Studium bei Siemens. Dabei setzt Siemens neue Maßstäbe in der beruflichen Bildung: Künstliche Intelligenz (KI) ist heute fester Bestandteil aller Ausbildungs- und Lernprozesse.",
    type: "AI_STRATEGY",
    date: "2026-09-01",
    source: {
      name: "Siemens",
      url: "https://press.siemens.com/global/de/pressemitteilung/siemens-setzt-neue-massstaebe-der-ausbildung-ki-kompetenz-fest-verankert",
      sourceType: "PRESS_RELEASE",
    },
  },
  {
    company: {
      name: "BMW AG",
      website: "https://www.bmwgroup.com",
      city: "München",
      country: "Deutschland",
      industry: "Automobil",
      latitude: 48.1767,
      longitude: 11.5602,
      isSeed: false,
    },
    title:
      "BMW Group erweitert Erhebung von Bilddaten aus BMW Kundenfahrzeugen in Europa für kontinuierliche Produktverbesserung und mehr Sicherheit im Straßenverkehr.",
    description:
      "Videodaten können ab Mitte September ereignisbezogen (limitiert auf maximal 120 Sekunden je Ereignis) in unveränderter Form aus den Fahrzeugen erhoben werden. Unveränderte Bilddaten werden genutzt, um mittels maschinellen Lernens Fahrerassistenzsysteme und teilautomatisierte Fahrfunktionen weiterzuentwickeln.",
    type: "DATA_ANALYTICS",
    date: "2026-09-07",
    source: {
      name: "BMW Group",
      url: "https://www.press.bmwgroup.com/deutschland/article/detail/T0460397DE",
      sourceType: "PRESS_RELEASE",
    },
  },
  {
    company: {
      name: "HARTING Technology Group",
      website: "https://www.harting.com",
      city: "Espelkamp",
      country: "Deutschland",
      industry: "Industrielle Verbindungstechnik",
      latitude: 52.3769,
      longitude: 8.6236,
      isSeed: false,
    },
    title: "HARTING Accelerates Cloud Transformation with RISE with SAP",
    description:
      "SAP SE announced that HARTING Technology Group has signed a long-term contract for RISE with SAP. Moving to SAP Cloud ERP Private, the company will consolidate its ERP, business process intelligence, and service capabilities in a unified cloud-based subscription model.",
    type: "ERP_TRANSFORMATION",
    date: "2026-09-02",
    source: {
      name: "SAP News",
      url: "https://news.sap.com/2026/09/harting-accelerates-cloud-transformation-with-rise-with-sap/",
      sourceType: "NEWS",
    },
  },
];
