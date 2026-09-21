export type CompanyLogoConfig =
  | { type: "image"; src: string }
  | { type: "initials"; initials: string; background: string; foreground: string };

const COMPANY_LOGOS: Record<string, CompanyLogoConfig> = {
  "VIA optronics": { type: "image", src: "/logos/via-optronics.svg" },
  Goldhofer: { type: "image", src: "/logos/goldhofer.svg" },
  Schaeffler: { type: "image", src: "/logos/schaeffler.svg" },
  "ARS Altmann": { type: "image", src: "/logos/ars-altmann.svg" },
  "SAF-HOLLAND": { type: "image", src: "/logos/saf-holland.svg" },
  SKZ: { type: "image", src: "/logos/skz.svg" },
  WIKA: { type: "image", src: "/logos/wika.svg" },
  "EM Gerätebau": {
    type: "initials",
    initials: "EM",
    background: "#35556b",
    foreground: "#e8eef4",
  },
  Climaline: {
    type: "initials",
    initials: "CL",
    background: "#1a6d78",
    foreground: "#e7f7f6",
  },
  "Authentic Style": {
    type: "initials",
    initials: "AS",
    background: "#5a4a3c",
    foreground: "#f3eadf",
  },
};

const INITIAL_PALETTE = ["#35556b", "#1a6d78", "#3d5c4a", "#4a5568", "#3f4f6b", "#5a4a3c"];

export function companyInitials(name: string): string {
  const cleaned = name.replace(/\[DEMO\]/gi, "").trim();
  const parts = cleaned.split(/[\s-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase() || "?";
}

function colorFromName(name: string): string {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0;
  }
  return INITIAL_PALETTE[hash % INITIAL_PALETTE.length]!;
}

export function getCompanyLogo(name: string): CompanyLogoConfig {
  return (
    COMPANY_LOGOS[name] ?? {
      type: "initials",
      initials: companyInitials(name),
      background: colorFromName(name),
      foreground: "#eef3f7",
    }
  );
}
