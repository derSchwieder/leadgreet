"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/companies", label: "Companies" },
  { href: "/signals", label: "Signals" },
  { href: "/contacts", label: "Contacts" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/sources", label: "Sources" },
  { href: "/settings", label: "Settings" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-canvas-elevated">
      <div className="border-b border-line px-5 py-6">
        <Link href="/" className="block">
          <p className="text-[15px] font-semibold tracking-tight text-ink">
            lead<span className="text-accent">greet</span>
          </p>
          <p className="mt-2 text-[11px] leading-4 text-ink-muted">
            Find the signal. Start the conversation. Make Business.
          </p>
        </Link>
      </div>
      <nav aria-label="Primary" className="flex flex-1 flex-col gap-0.5 p-3">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-md px-3 py-2 text-sm transition ${
                active
                  ? "bg-accent-glow text-accent"
                  : "text-ink-muted hover:bg-canvas-hover hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <p className="px-5 py-4 text-[10px] uppercase tracking-[0.16em] text-ink-faint">
        Sales Intelligence
      </p>
    </aside>
  );
}
