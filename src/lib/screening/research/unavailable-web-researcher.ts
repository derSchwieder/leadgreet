import { emptyContactFinding } from "../contacts/run";
import type { ContactResearchFinding, ContactResearchInput } from "../contacts/types";
import type { NormalizedScreeningInput } from "../normalize";
import type {
  CompanyResearchFinding,
  SignalResearchFinding,
  WebResearchPort,
} from "./types";
import { WEB_RESEARCH_UNAVAILABLE } from "./types";

/** Default port: no search provider is configured in this app. */
export class UnavailableWebResearchPort implements WebResearchPort {
  readonly available = false;
  readonly provider = "none";
  readonly unavailableCode = WEB_RESEARCH_UNAVAILABLE;

  async researchCompany(_input: NormalizedScreeningInput): Promise<CompanyResearchFinding> {
    return {
      profile: {},
      sources: [],
      companyId: null,
      available: false,
    };
  }

  async researchSignals(_input: NormalizedScreeningInput): Promise<SignalResearchFinding> {
    return { signals: [], sources: [] };
  }

  async researchContacts(_input: ContactResearchInput): Promise<ContactResearchFinding> {
    return emptyContactFinding({
      available: false,
      provider: this.provider,
    });
  }
}
