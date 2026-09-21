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
          DEFAULT: "#0c1319",
          elevated: "#121b24",
          card: "#18242e",
          hover: "#20303c",
        },
        line: {
          DEFAULT: "#2a3c4b",
          strong: "#3a5164",
        },
        ink: {
          DEFAULT: "#eef3f7",
          muted: "#bac8d4",
          faint: "#8fa3b4",
        },
        accent: {
          DEFAULT: "#2ec9b0",
          dim: "#1c8f7e",
          glow: "#2ec9b024",
        },
        score: {
          hot: "#2ec9b0",
          warm: "#d4b84a",
          cool: "#8b9aab",
        },
        danger: "#e06c75",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 0 0 1px rgba(42, 60, 75, 0.85), 0 14px 36px rgba(0, 0, 0, 0.22)",
        featured: "0 0 0 1px rgba(46, 201, 176, 0.28), 0 14px 36px rgba(0, 0, 0, 0.22)",
      },
      borderRadius: {
        panel: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
