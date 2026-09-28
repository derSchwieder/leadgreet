import { describe, expect, it } from "vitest";
import {
  namesMatch,
  normalizeScreeningDomain,
  normalizeScreeningInput,
  normalizeScreeningName,
  websitesMatch,
} from "./normalize";

describe("normalizeScreeningInput", () => {
  it("keeps a plain company name", () => {
    expect(normalizeScreeningName("DATEV")).toBe("DATEV");
  });

  it("strips a screenen suffix", () => {
    expect(normalizeScreeningName("DATEV screenen")).toBe("DATEV");
    expect(normalizeScreeningName("DATEV screenen.")).toBe("DATEV");
  });

  it("normalizes domains without inventing a host", () => {
    expect(normalizeScreeningDomain("https://www.datev.de/")).toBe("datev.de");
    expect(normalizeScreeningDomain("datev.de")).toBe("datev.de");
    expect(normalizeScreeningDomain(null)).toBeNull();
    expect(normalizeScreeningDomain("")).toBeNull();
  });

  it("matches names and websites conservatively", () => {
    expect(namesMatch("DATEV", "datev")).toBe(true);
    expect(namesMatch("DATEV", "DATEV eG")).toBe(false);
    expect(websitesMatch("https://www.datev.de", "datev.de")).toBe(true);
    expect(websitesMatch("datev.de", "example.com")).toBe(false);
    expect(normalizeScreeningInput({ name: "DATEV screenen", domain: "https://DATEV.de" })).toEqual({
      name: "DATEV",
      domain: "datev.de",
    });
  });
});
