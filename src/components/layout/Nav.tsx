"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { EdnLogo } from "@/components/logo/EdnLogo";
import { cn } from "@/lib/utils";
import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/dashboard",  label: "Início" },
  { href: "/rsvp",       label: "Confirmação" },
  { href: "/memories",   label: "Memórias" },
  { href: "/classmates", label: "Turma" },
  { href: "/messages",   label: "Mensagens" },
  { href: "/profile/edit", label: "Meu Perfil" },
];

export function Nav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-edn-navy/95 backdrop-blur-sm border-b border-edn-navy-mid">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 shrink-0">
          <EdnLogo size={32} showText={false} />
          <span className="font-display text-white font-semibold text-sm hidden sm:block">
            EDN · 2006
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-body transition-colors",
                pathname === link.href
                  ? "bg-white/15 text-white"
                  : "text-edn-mist hover:text-white hover:bg-white/10"
              )}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-body transition-colors",
                pathname === "/admin"
                  ? "bg-edn-steel-lt/30 text-white"
                  : "text-yellow-300 hover:text-yellow-100 hover:bg-white/10"
              )}
            >
              Admin
            </Link>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="ml-2 p-1.5 text-edn-mist hover:text-white transition-colors"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-edn-navy border-t border-edn-navy-mid px-4 py-3 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "px-3 py-2.5 rounded-md text-sm font-body transition-colors",
                pathname === link.href
                  ? "bg-white/15 text-white"
                  : "text-edn-mist hover:text-white hover:bg-white/10"
              )}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" onClick={() => setOpen(false)}
              className="px-3 py-2.5 rounded-md text-sm text-yellow-300">
              Admin
            </Link>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-edn-mist hover:text-white"
          >
            <LogOut size={14} /> Sair
          </button>
        </div>
      )}
    </header>
  );
}
