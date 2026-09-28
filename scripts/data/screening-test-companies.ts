import type { SignalType, SourceType } from "@prisma/client";

/**
 * One-off screening-test dataset. Public, verifiable sources only.
 * Signal copy is taken from the cited press page. No invented URLs.
 * Coordinates are public city centroids (not street addresses).
 */
export type ScreeningTestSource = {
  name: string;
  url: string;
  sourceType: SourceType;
};

export type ScreeningTestSignal = {
  title: string;
  description: string;
  type: SignalType;
  date: string;
  source: ScreeningTestSource;
};

export type ScreeningTestCompany = {
  name: string;
  city: string;
  country: string;
  website: string;
  industry?: string;
  employees?: number;
  revenue?: string;
  latitude?: number;
  longitude?: number;
  isSeed: false;
  signals: ScreeningTestSignal[];
};

export const SCREENING_TEST_COMPANIES: ScreeningTestCompany[] = [
  {
    name: "Siemens AG",
    city: "München",
    country: "Deutschland",
    website: "https://www.siemens.com",
    industry: "Industrieautomation",
    latitude: 48.1374,
    longitude: 11.5755,
    isSeed: false,
    signals: [
      {
        title: "Siemens Industrial Copilot gewinnt Hermes Award 2025",
        description:
          "Die Deutsche Messe AG verleiht den Hermes Award 2025 an den Siemens Industrial Copilot, den ersten ganzheitlichen generativen KI-Assistenten für die Diskrete- und Prozessindustrie. Der Assistent ermöglicht es Entwicklungsteams unter anderem, SPS-Code in ihrer Muttersprache zu generieren.",
        type: "GENAI",
        date: "2025-03-30",
        source: {
          name: "Siemens Presse",
          url: "https://press.siemens.com/global/de/pressemitteilung/generative-ki-fuer-die-industrie-siemens-industrial-copilot-gewinnt-hermes-award",
          sourceType: "PRESS_RELEASE",
        },
      },
      {
        title: "Siemens stellt KI-Agenten für die Industrieautomatisierung vor",
        description:
          "Auf der Automate 2025 kündigt Siemens KI-Agenten im Industrial-Copilot-Ökosystem an. Ein Orchestrator setzt spezialisierte Agenten ein, die industrielle Workflows autonom über Design, Planung, Engineering, Betrieb und Service ausführen sollen.",
        type: "AI_AGENT",
        date: "2025-05-12",
        source: {
          name: "Siemens Press",
          url: "https://press.siemens.com/global/en/pressrelease/siemens-introduces-ai-agents-industrial-automation",
          sourceType: "PRESS_RELEASE",
        },
      },
    ],
  },
  {
    name: "Robert Bosch GmbH",
    city: "Stuttgart",
    country: "Deutschland",
    website: "https://www.bosch.com",
    industry: "Technologie und Mobilität",
    latitude: 48.7758,
    longitude: 9.1829,
    isSeed: false,
    signals: [
      {
        title: "Bosch Tech Day 2025: Investitionen in KI als Wachstumstreiber",
        description:
          "Bosch kündigt an, bis Ende 2027 mehr als 2,5 Milliarden Euro in künstliche Intelligenz zu investieren. KI soll automatisiertes Fahren sicherer machen, Qualität in der Produktion prüfen und Alltagsprodukte unterstützen.",
        type: "INVESTMENT",
        date: "2025-06-25",
        source: {
          name: "Bosch Media Service",
          url: "https://www.bosch-presse.de/pressportal/de/de/bosch-tech-day-2025-bosch-setzt-mit-hohen-investitionen-auf-ki-als-wachstumstreiber-277250.html",
          sourceType: "PRESS_RELEASE",
        },
      },
    ],
  },
  {
    name: "SAP SE",
    city: "Walldorf",
    country: "Deutschland",
    website: "https://www.sap.com",
    industry: "Unternehmenssoftware",
    latitude: 49.3064,
    longitude: 8.6424,
    isSeed: false,
    signals: [
      {
        title: "SAP stellt einsatzbereite Joule Agents vor",
        description:
          "SAP gibt die Verfügbarkeit einsatzbereiter Joule Agents für Finance, Service und Sales bekannt. Zusätzlich wird ein Agent Builder in Joule Studio in SAP Build angekündigt, mit dem eigene Agenten ohne Code erstellt werden können.",
        type: "AI_AGENT",
        date: "2025-02-13",
        source: {
          name: "SAP News Center",
          url: "https://news.sap.com/2025/02/joule-sap-uniquely-delivers-ai-agents/",
          sourceType: "PRESS_RELEASE",
        },
      },
    ],
  },
  {
    name: "Infineon Technologies AG",
    city: "Neubiberg",
    country: "Deutschland",
    website: "https://www.infineon.com",
    industry: "Halbleiter",
    latitude: 48.0756,
    longitude: 11.6731,
    isSeed: false,
    signals: [
      {
        title: "Infineon entwickelt mit NVIDIA 800-V-HVDC-Stromversorgung für KI-Rechenzentren",
        description:
          "Infineon und NVIDIA entwickeln eine 800-V-Hochvolt-Gleichstrom-Architektur für künftige KI-Server-Racks. Die Architektur soll die Energieverteilung im Rechenzentrum effizienter machen und die Stromumwandlung direkt am GPU-Chip ermöglichen.",
        type: "AI_PROJECT",
        date: "2025-05-20",
        source: {
          name: "Infineon Presse",
          url: "https://www.infineon.com/de/press-release/2025/infxx202505-107",
          sourceType: "PRESS_RELEASE",
        },
      },
    ],
  },
  {
    name: "BMW AG",
    city: "München",
    country: "Deutschland",
    website: "https://www.bmwgroup.com",
    industry: "Automobil",
    latitude: 48.1767,
    longitude: 11.5602,
    isSeed: false,
    signals: [
      {
        title: "Vier Superbrains für die Neue Klasse",
        description:
          "Die BMW Group bündelt Rechenleistung für Infotainment, automatisiertes Fahren, Fahrdynamik und Grundfunktionen in vier Hochleistungsrechnern („Superbrains“) der Neuen Klasse. Die Architektur ist für Software-Updates inklusive KI-gestützter Kundenerlebnisse ausgelegt.",
        type: "SOFTWARE_MODERNIZATION",
        date: "2025-03-11",
        source: {
          name: "BMW Group PressClub",
          url: "https://www.press.bmwgroup.com/global/article/detail/T0448372EN/four-superbrains-for-the-neue-klasse:-more-intelligent-more-efficient-more-powerful?language=en",
          sourceType: "PRESS_RELEASE",
        },
      },
    ],
  },
  {
    name: "Mercedes-Benz Group AG",
    city: "Stuttgart",
    country: "Deutschland",
    website: "https://group.mercedes-benz.com",
    industry: "Automobil",
    latitude: 48.7833,
    longitude: 9.1815,
    isSeed: false,
    signals: [
      {
        title: "Digital Factory Campus Berlin: KI und humanoide Roboter in der Produktion",
        description:
          "Mercedes-Benz erweitert den Digital Factory Campus in Berlin-Marienfelde um KI-Funktionen wie das Digital Factory Chatbot Ecosystem und die MO360LLM Suite sowie humanoide Roboter von Apptronik. Neue Prozesse sollen anschließend im globalen Produktionsnetzwerk ausgerollt werden.",
        type: "AI_PROJECT",
        date: "2025-03-18",
        source: {
          name: "Mercedes-Benz Media",
          url: "https://media.mercedes-benz.com/article/8856eeca-92d1-474f-9760-d42469d190a5",
          sourceType: "PRESS_RELEASE",
        },
      },
    ],
  },
  {
    name: "BASF SE",
    city: "Ludwigshafen",
    country: "Deutschland",
    website: "https://www.basf.com",
    industry: "Chemie",
    latitude: 49.4811,
    longitude: 8.4353,
    isSeed: false,
    signals: [
      {
        title: "BASF Research Press Briefing: QKnows und erster KI-Reaktor",
        description:
          "BASF stellt die Wissensplattform QKnows vor, die mit KI in mehr als 400 Millionen wissenschaftlichen, patentbezogenen und internen Dokumenten sucht. Der erste KI-Reaktor plant, führt und analysiert Experimente autonom; erste Versuche waren laut BASF 20-mal schneller als manuelle Durchführung.",
        type: "AI_PROJECT",
        date: "2025-12-11",
        source: {
          name: "BASF News",
          url: "https://www.basf.com/global/de/media/news-releases/2025/12/p-25-241",
          sourceType: "PRESS_RELEASE",
        },
      },
    ],
  },
  {
    name: "TRUMPF SE + Co. KG",
    city: "Ditzingen",
    country: "Deutschland",
    website: "https://www.trumpf.com",
    industry: "Werkzeugmaschinen und Laser",
    latitude: 48.8261,
    longitude: 9.0669,
    isSeed: false,
    signals: [
      {
        title: "KI-Qualitätsprüfung VisionLine Inspect für Laserschweißen",
        description:
          "TRUMPF hat eine KI-Lösung entwickelt, die die Qualität von Bauteilen unmittelbar nach dem Laserschweißen prüft, etwa bei Batterien für E-Autos oder im Karosseriebau. Erste Automobilkunden nutzen VisionLine Inspect bereits im Serieneinsatz.",
        type: "AI_PROJECT",
        date: "2025-03-28",
        source: {
          name: "TRUMPF Newsroom",
          url: "https://www.trumpf.com/de_DE/newsroom/pressemitteilungen-global/pressemitteilung-detailseite-global/release/laserschweissen-kuenstliche-intelligenz-von-trumpf-steigert-produktivitaet-und-qualitaet-im-automobilbau-9304/",
          sourceType: "PRESS_RELEASE",
        },
      },
    ],
  },
  {
    name: "Festo SE & Co. KG",
    city: "Esslingen",
    country: "Deutschland",
    website: "https://www.festo.com",
    industry: "Automatisierungstechnik",
    latitude: 48.7396,
    longitude: 9.3098,
    isSeed: false,
    signals: [
      {
        title: "Festo AX Motion Insights Electric überwacht elektrische Achsen per KI",
        description:
          "Festo stellt AX Motion Insights Electric vor, eine KI-Anwendung zur Überwachung elektrischer Achsen und Servoantriebe auf Verschleiß und Anomalien. Die App lässt sich mit Smartenance koppeln und on-premises per Docker betreiben.",
        type: "PROCESS_AUTOMATION",
        date: "2025-05-11",
        source: {
          name: "Festo Presse",
          url: "https://press.festo.com/index.php/de/node/5114",
          sourceType: "PRESS_RELEASE",
        },
      },
      {
        title: "Festo AX Motion Insights Pneumatic überwacht Pneumatikzylinder",
        description:
          "Festo ergänzt die AX-Plattform um AX Motion Insights Pneumatic. Die KI-Anwendung überwacht Pneumatikzylinder auf Verschleiß und Anomalien, um ungeplante Stillstände zu vermeiden.",
        type: "PROCESS_AUTOMATION",
        date: "2025-11-18",
        source: {
          name: "Festo Presse",
          url: "https://press.festo.com/de/node/5132",
          sourceType: "PRESS_RELEASE",
        },
      },
    ],
  },
  {
    name: "DATEV eG",
    city: "Nürnberg",
    country: "Deutschland",
    website: "https://www.datev.de",
    industry: "Software und IT-Dienstleistungen",
    latitude: 49.4521,
    longitude: 11.0767,
    isSeed: false,
    signals: [
      {
        title: "DATEV Automatisierungsservice Rechnungen generiert KI-Buchungsvorschläge",
        description:
          "Der DATEV Automatisierungsservice Rechnungen ist laut DATEV für mehr als 100.000 Buchführungen im Einsatz. Rund 7.000 Kanzleien lassen monatlich durchschnittlich mehr als 7,5 Millionen KI-basierte Buchungsvorschläge erzeugen.",
        type: "PROCESS_AUTOMATION",
        date: "2025-09-17",
        source: {
          name: "DATEV Presse",
          url: "https://www.datev.de/web/de/presse/pressemeldungen/meldungen-2025/ki-reduziert-manuellen-aufwand-beim-buchen/",
          sourceType: "PRESS_RELEASE",
        },
      },
    ],
  },
  {
    name: "TeamViewer SE",
    city: "Göppingen",
    country: "Deutschland",
    website: "https://www.teamviewer.com",
    industry: "Software",
    latitude: 48.7054,
    longitude: 9.6511,
    isSeed: false,
    signals: [
      {
        title: "TeamViewer bündelt KI-Funktionen unter TeamViewer Intelligence",
        description:
          "TeamViewer fasst CoPilot sowie Session Insights & Analytics unter dem Label TeamViewer Intelligence zusammen. Das Add-on richtet sich an IT-Support-Teams mit Corporate- oder Tensor-Lizenz.",
        type: "GENAI",
        date: "2025-07-02",
        source: {
          name: "TeamViewer Presse",
          url: "https://www.teamviewer.com/de/global/company/press/2025/teamviewer-expands-ai-portfolio-with-teamviewer-intelligence-for-it-support-workflows/",
          sourceType: "PRESS_RELEASE",
        },
      },
      {
        title: "TeamViewer ermöglicht agentlosen Remote-Zugriff auf Industrieanlagen",
        description:
          "TeamViewer stellt Agentless Access für die Enterprise-Plattform Tensor vor. Industrieunternehmen können Maschinen und Steuerungssysteme remote warten, ohne Software lokal auf den Geräten zu installieren.",
        type: "SOFTWARE_MODERNIZATION",
        date: "2025-11-10",
        source: {
          name: "TeamViewer Presse",
          url: "https://www.teamviewer.com/de/global/company/press/2025/teamviewer-agentless-access-for-industrial-remote-operations/",
          sourceType: "PRESS_RELEASE",
        },
      },
    ],
  },
  {
    name: "ZF Friedrichshafen AG",
    city: "Friedrichshafen",
    country: "Deutschland",
    website: "https://www.zf.com",
    industry: "Automobilzulieferer",
    latitude: 47.6567,
    longitude: 9.465,
    isSeed: false,
    signals: [
      {
        title: "ZF Annotate validiert ADAS-Systeme mit KI",
        description:
          "ZF stellt den cloudbasierten, KI-gestützten Validierungsdienst ZF Annotate vor. Die Lösung erzeugt Ground Truth für ADAS/AD-Systeme von Level 2+ bis 5 und soll den Validierungsprozess laut ZF um bis zu das Zehnfache beschleunigen.",
        type: "AI_PROJECT",
        date: "2025-06-17",
        source: {
          name: "ZF Presse",
          url: "https://press.zf.com/press/de/releases/release_88128.html",
          sourceType: "PRESS_RELEASE",
        },
      },
    ],
  },
  {
    name: "Volkswagen AG",
    city: "Wolfsburg",
    country: "Deutschland",
    website: "https://www.volkswagen-group.com",
    industry: "Automobil",
    latitude: 52.4227,
    longitude: 10.7865,
    isSeed: false,
    signals: [
      {
        title: "Volkswagen investiert bis 2030 bis zu einer Milliarde Euro in KI",
        description:
          "Die Volkswagen Group plant, bis 2030 bis zu eine Milliarde Euro in KI-gestützte Fahrzeugentwicklung, industrielle Anwendungen und IT-Infrastruktur zu investieren. Konzernweit sind laut Mitteilung über 1.200 KI-Anwendungen aktiv.",
        type: "INVESTMENT",
        date: "2025-09-09",
        source: {
          name: "Volkswagen Group Newsroom",
          url: "https://www.volkswagen-group.com/de/pressemitteilungen/innovationskraft-steigern-mobilitaet-neugestalten-volkswagen-investiert-in-kuenstliche-intelligenz-19852",
          sourceType: "PRESS_RELEASE",
        },
      },
      {
        title: "Volkswagen verlängert Digitale Produktionsplattform mit AWS um fünf Jahre",
        description:
          "Volkswagen und Amazon Web Services verlängern die Zusammenarbeit bei der Digitalen Produktionsplattform (DPP) um weitere fünf Jahre. Die Fabrik-Cloud soll KI und IT-Systeme flächendeckend in den Werken einsetzen.",
        type: "CLOUD_MIGRATION",
        date: "2025-08-28",
        source: {
          name: "Volkswagen Group Newsroom",
          url: "https://www.volkswagen-group.com/de/pressemitteilungen/effizienter-intelligenter-resilienter-volkswagen-group-richtet-produktion-gemeinsam-mit-aws-auf-ki-zeitalter-aus-19774",
          sourceType: "PRESS_RELEASE",
        },
      },
    ],
  },
  {
    name: "Deutsche Telekom AG",
    city: "Bonn",
    country: "Deutschland",
    website: "https://www.telekom.com",
    industry: "Telekommunikation",
    latitude: 50.7374,
    longitude: 7.0982,
    isSeed: false,
    signals: [
      {
        title: "Telekom und NVIDIA bauen industrielle KI-Cloud für Gigafactories",
        description:
          "Deutsche Telekom und NVIDIA kündigen den Aufbau der ersten industriellen KI-Cloud für europäische Hersteller in Deutschland an. Geplant sind bis zu 10.000 GPUs; die Telekom stellt Rechenzentren, Betrieb, Vertrieb sowie Security- und KI-Lösungen bereit.",
        type: "AI_PROJECT",
        date: "2025-06-13",
        source: {
          name: "Deutsche Telekom Medien",
          url: "https://www.telekom.com/de/newsroom/aktuelles/medieninformationen/2025/06/ki-turbo-fuer-gigafactories",
          sourceType: "PRESS_RELEASE",
        },
      },
    ],
  },
  {
    name: "KUKA AG",
    city: "Augsburg",
    country: "Deutschland",
    website: "https://www.kuka.com",
    industry: "Robotik und Automatisierung",
    latitude: 48.3705,
    longitude: 10.8978,
    isSeed: false,
    signals: [
      {
        title: "KUKA zeigt auf der automatica 2025 den KI-Assistenten iiQWorks.Copilot",
        description:
          "KUKA präsentiert auf der automatica 2025 den gemeinsam mit Microsoft entwickelten KI-Assistenten iiQWorks.Copilot. Kunden sollen Roboter per Texteingabe in Alltagssprache programmieren können; eine erste Version ist bis Jahresende geplant.",
        type: "GENAI",
        date: "2025-06-24",
        source: {
          name: "KUKA Presse",
          url: "https://www.kuka.com/de-de/unternehmen/presse/news/2025/06/kuka-highlights-automatica-2025",
          sourceType: "PRESS_RELEASE",
        },
      },
    ],
  },
  {
    name: "Bechtle AG",
    city: "Neckarsulm",
    country: "Deutschland",
    website: "https://www.bechtle.com",
    industry: "IT-Dienstleistungen",
    latitude: 49.1892,
    longitude: 9.225,
    isSeed: false,
    signals: [
      {
        title: "Bechtle veröffentlicht strategische KI-Positionierung",
        description:
          "Die Bechtle AG veröffentlicht ihre strategische Positionierung zu Künstlicher Intelligenz für Kundenprojekte, interne Prozesse und neue Lösungen. Gleichzeitig baut Bechtle die Mitgliedschaft im Innovation Park Artificial Intelligence (IPAI) aus.",
        type: "AI_STRATEGY",
        date: "2025-02-11",
        source: {
          name: "Bechtle Presse",
          url: "https://www.bechtle.com/ueber-bechtle/presse/pressemeldungen/2025/bechtle-setzt-auf-kuenstliche-intelligenz-als-schluesseltechnologie",
          sourceType: "PRESS_RELEASE",
        },
      },
    ],
  },
  {
    name: "Celonis SE",
    city: "München",
    country: "Deutschland",
    website: "https://www.celonis.com",
    industry: "Process Mining",
    latitude: 48.1486,
    longitude: 11.5683,
    isSeed: false,
    signals: [
      {
        title: "Celonis startet Process Collaboration Agent mit Rollio",
        description:
          "Celonis und Rollio stellen den Process Collaboration Agent vor. Der KI-Agent soll Teams über natürliche Sprache bei der Korrektur von Prozessabweichungen unterstützen und ist Teil der AgentC-Suite für KI-Agenten.",
        type: "AI_AGENT",
        date: "2025-01-09",
        source: {
          name: "Celonis Presse",
          url: "https://www.celonis.com/de/news/press/celonis-launches-process-collaboration-agent-powered-by-rollio-to-accelerate-decision-making",
          sourceType: "PRESS_RELEASE",
        },
      },
    ],
  },
  {
    name: "Continental AG",
    city: "Hannover",
    country: "Deutschland",
    website: "https://www.continental.com",
    industry: "Automobilzulieferer",
    latitude: 52.3759,
    longitude: 9.732,
    isSeed: false,
    signals: [
      {
        title: "Continental setzt autonome Roboter in der Reifenproduktion in Hannover ein",
        description:
          "Im ContiLifeCycle-Werk Hannover-Stöcken übernehmen seit März 2025 sieben autonome mobile Roboter den innerbetrieblichen Transport von Reifenrohlingen. Die Roboter sind direkt mit dem digitalen Auftragssystem verbunden.",
        type: "PROCESS_AUTOMATION",
        date: "2025-11-18",
        source: {
          name: "Continental Presse",
          url: "https://www.continental.com/de/presse/pressemitteilungen/20251118-roboter-clc/",
          sourceType: "PRESS_RELEASE",
        },
      },
    ],
  },
  {
    name: "Deutsche Bahn AG",
    city: "Berlin",
    country: "Deutschland",
    website: "https://www.deutschebahn.com",
    industry: "Mobilität und Logistik",
    latitude: 52.52,
    longitude: 13.405,
    isSeed: false,
    signals: [
      {
        title: "KI-Assistenz Kiana berät Reisende am Flughafenbahnhof BER",
        description:
          "Die Deutsche Bahn startet am Flughafenbahnhof BER den Testbetrieb der virtuellen Assistenz Kiana. Die KI soll Fahrgäste per Sprache zum passenden Ticket beraten und nutzt dafür Large Language Models.",
        type: "AI_AGENT",
        date: "2025-08-07",
        source: {
          name: "Deutsche Bahn Presse",
          url: "https://www.deutschebahn.com/de/presse/pressestart_zentrales_uebersicht/KI-Assistenz-Kiana-beraet-Bahnreisende-am-Flughafenbahnhof-BER-13476698",
          sourceType: "PRESS_RELEASE",
        },
      },
    ],
  },
  {
    name: "Uniper SE",
    city: "Düsseldorf",
    country: "Deutschland",
    website: "https://www.uniper.energy",
    industry: "Energie",
    latitude: 51.2277,
    longitude: 6.7735,
    isSeed: false,
    signals: [
      {
        title: "Uniper skaliert KI mit Celonis und Microsoft",
        description:
          "Celonis, Microsoft und Uniper geben eine Partnerschaft bekannt, mit der Uniper KI unternehmensweit skalieren will. Process Intelligence von Celonis soll die Basis für KI-gestützte Automatisierung und Prozessorchestrierung im Energiesektor bilden.",
        type: "DIGITAL_TRANSFORMATION",
        date: "2025-05-20",
        source: {
          name: "Celonis Presse",
          url: "https://www.celonis.com/de/news/press/celonis-collaborates-with-uniper-and-microsoft-to-drive-digital-transformation-in-the-energy-sector",
          sourceType: "PRESS_RELEASE",
        },
      },
    ],
  },
];
