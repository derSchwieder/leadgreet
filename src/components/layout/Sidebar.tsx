"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LeadgreetLogo } from "@/components/brand/LeadgreetLogo";

const NAV = [
  { href: "/", label: "Übersicht" },
  { href: "/radar", label: "Greet Radar" },
  { href: "/companies", label: "Unternehmen" },
  { href: "/signals", label: "Signale" },
  { href: "/contacts", label: "Kontakte" },
  { href: "/opportunities", label: "Chancen" },
  { href: "/content", label: "Meine Inhalte" },
  { href: "/sources", label: "Quellen" },
  { href: "/settings", label: "Einstellungen" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Hauptnavigation" className="flex flex-1 flex-col gap-1 p-3">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={`rounded-lg px-3 py-2 text-sm transition ${
              active
                ? "bg-accent-glow font-medium text-accent shadow-[inset_2px_0_0_0_#2ec9b0]"
                : "text-ink-muted hover:bg-canvas-hover hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function BrandBlock() {
  return (
    <Link href="/" aria-label="leadgreet" className="block">
      <LeadgreetLogo showClaim />
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-canvas-elevated/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/" aria-label="leadgreet">
          <LeadgreetLogo compact />
        </Link>
        <button
          type="button"
          className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink-muted hover:border-accent hover:text-accent"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Schließen" : "Menü"}
        </button>
      </header>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Navigation schließen"
            onClick={() => setOpen(false)}
          />
          <aside
            id="mobile-nav"
            className="relative flex h-full w-72 flex-col border-r border-line bg-canvas-elevated shadow-card"
          >
            <div className="border-b border-line px-5 py-6">
              <BrandBlock />
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
            <p className="px-5 py-4 text-[10px] uppercase tracking-[0.16em] text-ink-muted">
              Vertriebsintelligenz
            </p>
          </aside>
        </div>
      ) : null}

      <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-canvas-elevated lg:flex">
        <div className="border-b border-line px-5 py-7">
          <BrandBlock />
        </div>
        <NavLinks pathname={pathname} />
        <p className="px-5 py-4 text-[10px] uppercase tracking-[0.16em] text-ink-muted">
          Vertriebsintelligenz
        </p>
      </aside>
    </>
  );
}
