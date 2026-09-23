import { RadarDashboard } from "@/components/radar/RadarDashboard";
import { SetupState } from "@/components/ui/SetupState";
import { getCurrentAccountId } from "@/lib/db/accounts";
import { listExcludedCompanyIds } from "@/lib/db/account-company-state";
import { getAccountIcp } from "@/lib/db/account-icp";
import { listCompanyIcpRecords } from "@/lib/db/companies";
import { listRadarPoints } from "@/lib/db/radar";
import { listRadarProfiles } from "@/lib/db/radar-profiles";
import { getDatabaseGate } from "@/lib/db/status";
import { storedIcpFromRadarProfile } from "@/lib/icp";

export default async function RadarPage() {
  const db = await getDatabaseGate();
  if (db !== "ready") {
    return <SetupState unreachable={db === "unreachable"} />;
  }

  const accountId = await getCurrentAccountId();
  const excludedIds = await listExcludedCompanyIds(accountId);
  const [points, companies, profiles] = await Promise.all([
    listRadarPoints(accountId),
    listCompanyIcpRecords(excludedIds),
    listRadarProfiles(accountId),
  ]);
  const selected = profiles[0];
  const initialIcp = selected
    ? storedIcpFromRadarProfile(selected)
    : await getAccountIcp(accountId);

  return (
    <RadarDashboard
      points={points}
      companies={companies}
      initialIcp={initialIcp}
      initialProfiles={profiles}
      initialProfileId={selected?.id}
    />
  );
}
