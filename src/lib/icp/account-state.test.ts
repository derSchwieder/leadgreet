import { describe, expect, it } from "vitest";
import {
  excludeCompanyIds,
  isExcludedAccountCompanyStatus,
} from "./account-state";

describe("AccountCompanyState exclusion", () => {
  it("treats NOT_RELEVANT and DECLINED as hidden", () => {
    expect(isExcludedAccountCompanyStatus("NOT_RELEVANT")).toBe(true);
    expect(isExcludedAccountCompanyStatus("DECLINED")).toBe(true);
    expect(isExcludedAccountCompanyStatus(null)).toBe(false);
  });

  it("removes excluded companies from a radar list", () => {
    const visible = excludeCompanyIds(
      [
        { companyId: "bmw" },
        { companyId: "vw" },
        { companyId: "swiss" },
      ],
      new Set(["vw"]),
    );
    expect(visible.map((item) => item.companyId)).toEqual(["bmw", "swiss"]);
  });
});
