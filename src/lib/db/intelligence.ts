import { getCompanyById } from "./companies";
import { listContacts } from "./contacts";
import { listActiveContentItems } from "./content";
import { listActivitiesByCompany } from "./activities";
import { listServices } from "./services";
import { listSignals } from "./signals";
import { buildCompanyIntelligence } from "@/lib/intelligence";
import type { CompanyIntelligence } from "@/lib/intelligence";

/**
 * Company-level sales intelligence for one account.
 * Services, content and activities are queried with accountId.
 * Signals and contacts stay company-global, never mixed with another company.
 */
export async function getCompanyIntelligence(
  companyId: string,
  accountId: string,
): Promise<CompanyIntelligence> {
  const [company, signals, contacts, services, contentItems, activities] = await Promise.all([
    getCompanyById(companyId),
    listSignals({ companyId }),
    listContacts({ companyId }),
    listServices(accountId),
    listActiveContentItems(accountId),
    listActivitiesByCompany(accountId, companyId),
  ]);

  return buildCompanyIntelligence({
    accountId,
    company: {
      id: company.id,
      name: company.name,
      industry: company.industry,
      companySize: company.companySize,
    },
    signals: signals.map((signal) => ({
      id: signal.id,
      type: signal.type,
      title: signal.title,
      signalStrength: signal.signalStrength,
      detectedAt: signal.detectedAt,
    })),
    services: services.map((service) => ({
      id: service.id,
      accountId: service.accountId,
      name: service.name,
      description: service.description,
      targetIndustries: service.targetIndustries,
      targetCompanySizes: service.targetCompanySizes,
      targetRoles: service.targetRoles,
      matchingSignalTypes: service.matchingSignalTypes,
      businessCaseTypes: service.businessCaseTypes,
      valuePropositions: service.valuePropositions,
      conversationStarter: service.conversationStarter,
      isActive: service.isActive,
    })),
    contentItems: contentItems.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      url: item.url,
      isActive: item.isActive,
      businessCaseTypes: item.businessCaseTypes,
      targetRoles: item.targetRoles,
      targetCompanySizes: item.targetCompanySizes,
      services: item.services,
    })),
    contacts: contacts.map((contact) => ({
      id: contact.id,
      fullName: contact.fullName,
      role: contact.role,
      isDecisionMaker: contact.isDecisionMaker,
      email: contact.email,
    })),
    activities: activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      subject: activity.subject,
      occurredAt: activity.occurredAt,
      outcome: activity.outcome,
      accountId: activity.accountId,
    })),
  });
}
