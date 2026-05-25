"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { EdnLogo } from "@/components/logo/EdnLogo";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/rsvp",         label: "RSVP",      rsvp: true  },
  { href: "/classmates",   label: "Turma",     rsvp: false },
  { href: "/memories",     label: "Memórias",  rsvp: false },
  { href: "/messages",     label: "Mensagens", rsvp: false },
  { href: "/profile/edit", label: "Perfil",    rsvp: false },
];

export function Nav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-edn-mist/70 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 shrink-0">
          <EdnLogo size={32} showText={false} />
          <span className="font-display text-edn-navy font-semibold text-sm sm:block">
            EDN · 2006
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, rsvp }) => {
            const active = pathname === href;
            if (rsvp) {
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-body font-semibold transition-colors",
                    active
                      ? "bg-edn-navy-mid text-white"
                      : "bg-edn-navy text-white hover:bg-edn-navy-mid"
                  )}
                >
                  {label}
                </Link>
              );
            }
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-body transition-colors",
                  active
                    ? "bg-edn-cloud text-edn-navy font-medium"
                    : "text-edn-steel hover:text-edn-navy hover:bg-edn-cloud"
                )}
              >
                {label}
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-body transition-colors",
                pathname === "/admin"
                  ? "bg-edn-cloud text-edn-navy font-medium"
                  : "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
              )}
            >
              Admin
            </Link>
          )}

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="ml-2 px-3 py-1.5 rounded-md text-sm font-body text-edn-gray hover:text-edn-navy hover:bg-edn-cloud transition-colors"
          >
            Sair
          </button>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-edn-navy p-2"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu — every item is a full-width centered row */}
      {open && (
        <div className="md:hidden bg-white border-t border-edn-mist/70 px-4 py-4 flex flex-col gap-2">

          {/* RSVP — filled navy, always prominent */}
          <Link
            href="/rsvp"
            onClick={() => setOpen(false)}
            className={cn(
              "w-full py-3.5 rounded-lg text-center text-xs font-body font-semibold uppercase tracking-widest transition-colors",
              pathname === "/rsvp"
                ? "bg-edn-navy-mid text-white"
                : "bg-edn-navy text-white hover:bg-edn-navy-mid"
            )}
          >
            RSVP
          </Link>

          {/* Secondary links — same geometry, unfilled */}
          {NAV_LINKS.filter((l) => !l.rsvp).map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "w-full py-3.5 rounded-lg text-center text-xs font-body font-semibold uppercase tracking-widest transition-colors",
                pathname === href
                  ? "bg-edn-cloud text-edn-navy"
                  : "text-edn-navy hover:bg-edn-cloud"
              )}
            >
              {label}
            </Link>
          ))}

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="w-full py-3.5 rounded-lg text-center text-xs font-body font-semibold uppercase tracking-widest text-amber-600 hover:bg-amber-50 transition-colors"
            >
              Admin
            </Link>
          )}

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full py-3.5 rounded-lg text-center text-xs font-body font-semibold uppercase tracking-widest text-edn-gray hover:bg-edn-cloud transition-colors"
          >
            Sair
          </button>
        </div>
      )}
    </header>
  );
}
