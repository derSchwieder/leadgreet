import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

describe("screening engine isolation", () => {
  it("does not import Radar, Greet scoring, or a second ICP matcher", () => {
    const roots = [
      join(process.cwd(), "src/lib/screening"),
      join(process.cwd(), "src/lib/research"),
      join(process.cwd(), "src/lib/analysis"),
    ];
    const files = roots.flatMap((root) =>
      walk(root).filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts")),
    );
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/@\/lib\/radar\b/);
      expect(source, file).not.toMatch(/@\/app\/radar\b/);
      expect(source, file).not.toMatch(/scoreCompanyGreet|computeCompanyGreet/);
      expect(source, file).not.toMatch(/matchesRadarProfile|matchesRadarSensitivity/);
      if (file.includes(`${join("src", "lib", "analysis")}`)) {
        expect(source, file).not.toMatch(/import\s+\{[^}]*\bmatchesIcp\b/);
        expect(source, file).not.toMatch(/from\s+["']@\/lib\/icp\/match["']/);
      }
    }
  });
});
