import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const dist = path.join(
  path.dirname(createRequire(import.meta.url).resolve("maplibre-gl/package.json")),
  "dist",
);
const dest = path.join(process.cwd(), "public", "maplibre");
const files = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];

for (const file of files) {
  const from = path.join(dist, file);
  if (!existsSync(from)) {
    throw new Error(`MapLibre worker file missing: ${from}`);
  }
}

mkdirSync(dest, { recursive: true });

for (const file of files) {
  const from = path.join(dist, file);
  const to = path.join(dest, file);
  copyFileSync(from, to);
  console.log(`Copied ${path.relative(process.cwd(), from)} -> ${path.relative(process.cwd(), to)}`);
}
