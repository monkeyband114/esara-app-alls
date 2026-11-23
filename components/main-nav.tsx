"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Menu, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type NavLink = { href: string; label: string };
export type NavUser = { name: string; email: string; roleLabel: string; initials: string };

// Links that have child pages of their own in the nav only highlight on an exact match.
const EXACT_ONLY = new Set(["/dashboard", "/dashboard/staff"]);

function isActive(pathname: string, href: string) {
  return pathname === href || (!EXACT_ONLY.has(href) && pathname.startsWith(`${href}/`));
}

function SearchForm({ className }: { className?: string }) {
  return (
    <form action="/dashboard/search" role="search" className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input name="q" aria-label="Search staff and publications" placeholder="Search staff, publications, journals" className="pl-9" />
    </form>
  );
}

function SignOutButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className={cn("inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground", className)}
    >
      <LogOut className="h-4 w-4" /> Sign out
    </button>
  );
}

export function MainNav({ links, user }: { links: NavLink[]; user: NavUser | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium",
              isActive(pathname, link.href) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <SearchForm className="ml-auto hidden w-full max-w-xs md:block" />

      {user ? (
        <div className="hidden items-center gap-2 lg:flex">
          <div className="flex items-center gap-2 border-l pl-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{user.initials}</span>
            <span className="max-w-40 leading-tight">
              <span className="block truncate text-sm font-semibold">{user.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{user.roleLabel}</span>
            </span>
          </div>
          <SignOutButton />
        </div>
      ) : (
        <Link href="/login" className="hidden rounded-md px-3 py-2 text-sm font-semibold text-primary lg:block">Sign in</Link>
      )}

      <button
        type="button"
        className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-md border bg-white md:ml-0 lg:hidden"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open ? (
        <div id="mobile-menu" className="absolute inset-x-0 top-full border-b bg-white shadow-soft lg:hidden">
          <div className="mx-auto max-w-7xl space-y-3 px-4 py-4">
            <SearchForm className="md:hidden" />
            <nav aria-label="Main" className="grid gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-md px-3 py-2.5 text-sm font-medium",
                    isActive(pathname, link.href) ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            {user ? (
              <div className="flex items-center justify-between gap-3 border-t pt-3">
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-sm font-semibold">{user.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{user.roleLabel} · {user.email}</span>
                </span>
                <SignOutButton className="shrink-0" />
              </div>
            ) : (
              <Link href="/login" className="block rounded-md px-3 py-2.5 text-sm font-semibold text-primary">Sign in</Link>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
