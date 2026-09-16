export { prisma, getPrisma, isDatabaseConfigured, isDatabaseReachable } from "./client";
export { listCompanies, getCompanyById, createCompany } from "./companies";
export { listSources, getSourceById, createSource } from "./sources";
export { listSignals, getSignalById, createSignal } from "./signals";
export { listContacts, getContactById, createContact } from "./contacts";
export { listOpportunities, getOpportunityById, createOpportunity } from "./opportunities";
export { getDashboardData, getSeedInventory } from "./dashboard";
export { NotFoundError, DatabaseNotConfiguredError } from "./serialize";
