export { prisma, getPrisma, isDatabaseConfigured, isDatabaseReachable } from "./client";
export { listCompanies, getCompanyById, createCompany, updateCompany } from "./companies";
export { listSources, getSourceById, createSource } from "./sources";
export { listSignals, getSignalById, createSignal } from "./signals";
export {
  listContacts,
  getContactById,
  createContact,
  createContactForAccount,
  getContactForAccount,
  updateContact,
  updateContactForAccount,
  deleteContactForAccount,
  isMissingContactNotesColumn,
} from "./contacts";
export {
  listOpportunities,
  getOpportunityById,
  findActiveOpportunityByCompany,
  findOrCreateOpportunityForCompany,
  createOpportunity,
  updateOpportunityStatus,
} from "./opportunities";
export {
  getCurrentAccountId,
  getDemoAccountId,
  DEMO_ACCOUNT_SLUG,
  DEMO_ACCOUNT_NAME,
} from "./accounts";
export { getCurrentUser, type CurrentUser } from "./current-user";
export { ensureDemoUser, DEMO_USER_EMAIL, DEMO_USER_NAME } from "./users";
export {
  createOtp,
  verifyOtp,
  invalidatePendingOtps,
  isMissingAuthOtpTable,
} from "@/lib/otp";
export {
  createSession,
  getCurrentSession,
  getSessionByToken,
  revokeAllUserSessions,
  revokeSession,
  isMissingSessionTable,
} from "@/lib/session";
export {
  listServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from "./services";
export {
  listActivities,
  listActivitiesByCompany,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
} from "./activities";
export {
  listSalesTodos,
  getSalesTodoById,
  createSalesTodo,
  completeSalesTodo,
  isMissingSalesTodoTable,
} from "./todos";
export { listStatusHistory, createStatusHistory } from "./opportunity-status-history";
export {
  listContentItems,
  listActiveContentItems,
  getContentItemById,
  createContentItem,
  updateContentItem,
  deleteContentItem,
} from "./content";
export { getRecommendations } from "./recommendations";
export { getCompanyIntelligence } from "./intelligence";
export { geocodeAndCacheCompany } from "./geocoding";
export { getCompanyGreet, computeCompanyGreet } from "./company-greet";
export {
  upsertSignalFeedback,
  getSignalFeedback,
  listSignalFeedbackForCompany,
  captureSignalFeedbackContext,
  isMissingSignalFeedbackTable,
} from "./signal-feedback";
export { listRadarPoints } from "./radar";
export { getAccountIcp, saveAccountIcp, isMissingAccountIcpColumn } from "./account-icp";
export {
  listRadarProfiles,
  getRadarProfile,
  createRadarProfile,
  updateRadarProfile,
  deleteRadarProfile,
  isMissingRadarProfileTable,
} from "./radar-profiles";
export {
  getAccountCompanyState,
  setAccountCompanyState,
  listExcludedCompanyIds,
  isMissingAccountCompanyStateTable,
} from "./account-company-state";
export { getDashboardData, getSeedInventory } from "./dashboard";
export { NotFoundError, DatabaseNotConfiguredError, UnauthorizedError } from "./serialize";
