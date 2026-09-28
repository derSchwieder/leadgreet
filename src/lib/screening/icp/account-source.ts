import { getAccountIcp } from "@/lib/db/account-icp";
import { toIcpProfile, type IcpProfile } from "@/lib/icp";
import type { IcpSourcePort } from "../research/types";

/** Reads the existing account/radar ICP. Does not compute a second ICP. */
export class AccountIcpSource implements IcpSourcePort {
  async getProfile(accountId: string): Promise<IcpProfile> {
    return toIcpProfile(await getAccountIcp(accountId));
  }
}
