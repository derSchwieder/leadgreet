import { defineConfig } from "vitest/config";
import path from "path";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "prisma/**/*.test.ts"],
  },
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
