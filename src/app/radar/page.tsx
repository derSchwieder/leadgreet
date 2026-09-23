import { RadarDashboard } from "@/components/radar/RadarDashboard";
import { SetupState } from "@/components/ui/SetupState";
import { getCurrentAccountId } from "@/lib/db/accounts";
import { getAccountIcp } from "@/lib/db/account-icp";
import { listCompanyIcpRecords } from "@/lib/db/companies";
import { listRadarPoints } from "@/lib/db/radar";
import { getDatabaseGate } from "@/lib/db/status";

export default async function RadarPage() {
  const db = await getDatabaseGate();
  if (db !== "ready") {
    return <SetupState unreachable={db === "unreachable"} />;
  }

  const accountId = await getCurrentAccountId();
  const [points, companies, initialIcp] = await Promise.all([
    listRadarPoints(accountId),
    listCompanyIcpRecords(),
    getAccountIcp(accountId),
  ]);

  return <RadarDashboard points={points} companies={companies} initialIcp={initialIcp} />;
}
