import Link from "next/link";
import { Shield } from "lucide-react";
import { MainNav, type NavLink } from "@/components/main-nav";
import { roleLabel } from "@/lib/repository";
import { getCurrentUser, homeFor } from "@/lib/session";
import type { User } from "@/lib/types";

function linksFor(user: User | null): NavLink[] {
  if (!user) return [{ href: "/dashboard/leaderboard", label: "Leaderboard" }];
  if (user.role === "SUPER_ADMIN") {
    return [
      { href: "/dashboard/admin", label: "Admin" },
      { href: "/dashboard", label: "Overview" },
      { href: "/dashboard/ict", label: "ICT Center" },
      { href: "/dashboard/leaderboard", label: "Leaderboard" },
      { href: "/research-discovery", label: "Discovery" }
    ];
  }
  if (user.role === "ICT_PERSONNEL") {
    return [
      { href: "/dashboard/ict", label: "ICT Center" },
      { href: "/dashboard", label: "Overview" },
      { href: "/dashboard/leaderboard", label: "Leaderboard" },
      { href: "/research-discovery", label: "Discovery" }
    ];
  }
  return [
    { href: "/dashboard/staff", label: "My Dashboard" },
    { href: `/dashboard/staff/${user.id}`, label: "My Analytics" },
    { href: "/dashboard/leaderboard", label: "Leaderboard" },
    { href: "/research-discovery", label: "Discovery" }
  ];
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
}

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const navUser = user ? { name: user.fullName, email: user.email, roleLabel: roleLabel(user.role), initials: initials(user.fullName) } : null;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
        <div className="relative mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link href={user ? homeFor(user.role) : "/"} className="mr-2 flex shrink-0 items-center gap-2 font-bold text-primary">
            <Shield className="h-6 w-6" />
            ESARA
          </Link>
          <MainNav links={linksFor(user)} user={navUser} />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
