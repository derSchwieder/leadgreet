import Link from "next/link";
import { CompanyLogo } from "./CompanyLogo";

export function CompanyName({
  id,
  name,
  size = "sm",
  muted = false,
  href,
}: {
  id: string;
  name: string;
  size?: "xs" | "sm" | "md";
  muted?: boolean;
  href?: string | null;
}) {
  const className = `inline-flex min-w-0 items-center gap-2.5 ${
    muted ? "text-ink-muted" : "text-ink"
  }${href === null ? "" : " hover:text-accent"}`;
  const content = (
    <>
      <CompanyLogo name={name} size={size} />
      <span className="truncate font-medium">{name}</span>
    </>
  );

  if (href === null) {
    return <span className={className}>{content}</span>;
  }

  return (
    <Link href={href ?? `/companies/${id}`} className={className}>
      {content}
    </Link>
  );
}
