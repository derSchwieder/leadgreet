import type { ScreeningSalesHypothesis } from "@/types";
import type { SalesIntelligencePort } from "../research/types";

/** Default port: no LLM provider is configured in this app. */
export class UnavailableSalesIntelligenceAnalyzer implements SalesIntelligencePort {
  readonly available = false;

  async analyze(): Promise<ScreeningSalesHypothesis[]> {
    return [];
  }
}
