import { getCompanyLogo } from "@/lib/company-logo";

const SIZE_CLASS = {
  xs: "h-6 w-6 text-[9px]",
  sm: "h-8 w-8 text-[10px]",
  md: "h-11 w-11 text-sm",
} as const;

export function CompanyLogo({
  name,
  size = "sm",
}: {
  name: string;
  size?: keyof typeof SIZE_CLASS;
}) {
  const logo = getCompanyLogo(name);
  const box = SIZE_CLASS[size];

  if (logo.type === "image") {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-white ${box}`}
      >
        {/* Local SVG marks should not go through next/image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo.src} alt="" className="h-full w-full object-contain" />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-md font-semibold tracking-wide ${box}`}
      style={{ backgroundColor: logo.background, color: logo.foreground }}
      aria-hidden="true"
    >
      {logo.initials}
    </span>
  );
}
