import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  generateSessionToken,
  hashSessionToken,
  SESSION_TOKEN_BYTES,
  sessionTokenHashMatches,
} from "./tokens";

vi.mock("node:crypto", async () => {
  const actual = await vi.importActual<typeof import("node:crypto")>("node:crypto");
  return {
    ...actual,
    randomBytes: vi.fn(actual.randomBytes),
  };
});

describe("session tokens", () => {
  it("generates a cryptographically random token of sufficient length", () => {
    const token = generateSessionToken();
    expect(token.length).toBeGreaterThanOrEqual(43);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(randomBytes).toHaveBeenCalledWith(SESSION_TOKEN_BYTES);

    const another = generateSessionToken();
    expect(another).not.toBe(token);

    const source = readFileSync(join(process.cwd(), "src/lib/session/tokens.ts"), "utf8");
    expect(source).toContain("randomBytes");
    expect(source).not.toContain("Math.random");
  });

  it("stores a SHA-256 hash that does not contain the plaintext token", () => {
    const token = generateSessionToken();
    const stored = hashSessionToken(token);
    expect(stored).not.toBe(token);
    expect(stored).not.toContain(token);
    expect(stored).toMatch(/^[0-9a-f]{64}$/);
    expect(sessionTokenHashMatches(token, stored)).toBe(true);
    expect(sessionTokenHashMatches(`${token}x`, stored)).toBe(false);
  });
});
