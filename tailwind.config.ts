import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: "#070b10",
          elevated: "#0c131a",
          card: "#111920",
          hover: "#162029",
        },
        line: {
          DEFAULT: "#1c2a36",
          strong: "#2a3d4d",
        },
        ink: {
          DEFAULT: "#e8eef4",
          muted: "#8b9aab",
          faint: "#5c6b7a",
        },
        accent: {
          DEFAULT: "#2ec9b0",
          dim: "#1a7a6c",
          glow: "#2ec9b033",
        },
        score: {
          hot: "#2ec9b0",
          warm: "#c9b02e",
          cool: "#8b9aab",
        },
        danger: "#e06c75",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 0 0 1px #1c2a36, 0 8px 24px rgba(0, 0, 0, 0.28)",
      },
    },
  },
  plugins: [],
};

export default config;
