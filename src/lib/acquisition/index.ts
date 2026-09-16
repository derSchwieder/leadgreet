/**
 * Data acquisition port.
 *
 * This sprint does not crawl, scrape, or call external research APIs.
 * Later adapters (website, news, jobs, tenders) should implement
 * SignalAcquisitionAdapter and write through the existing db + scoring layers.
 */
export type AcquisitionChannel =
  | "website"
  | "press"
  | "news"
  | "jobs"
  | "annual_report"
  | "funding"
  | "tender"
  | "manual";

export interface AcquiredSignalDraft {
  companyName: string;
  type: string;
  title: string;
  description: string | null;
  eventDate: Date | null;
  sourceName: string;
  sourceUrl: string | null;
  channel: AcquisitionChannel;
}

export interface SignalAcquisitionAdapter {
  readonly channel: AcquisitionChannel;
  readonly enabled: boolean;
  collect(): Promise<AcquiredSignalDraft[]>;
}

export class DisabledAcquisitionAdapter implements SignalAcquisitionAdapter {
  readonly enabled = false;

  constructor(readonly channel: AcquisitionChannel) {}

  async collect(): Promise<AcquiredSignalDraft[]> {
    return [];
  }
}

export function getAcquisitionAdapters(): SignalAcquisitionAdapter[] {
  return [
    new DisabledAcquisitionAdapter("website"),
    new DisabledAcquisitionAdapter("press"),
    new DisabledAcquisitionAdapter("news"),
    new DisabledAcquisitionAdapter("jobs"),
  ];
}
