import Link from "next/link";
import { Bell, Search, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-primary">
            <Shield className="h-6 w-6" />
            ESARA
          </Link>
          <div className="relative ml-auto hidden w-full max-w-md md:block">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input aria-label="Global search" placeholder="Search staff, publications, journals" className="pl-9" />
          </div>
          <Link href="/dashboard/admin" className="text-sm font-medium text-muted-foreground">
            Admin
          </Link>
          <Link href="/dashboard/ict" className="text-sm font-medium text-muted-foreground">
            ICT
          </Link>
          <Link href="/dashboard/staff" className="text-sm font-medium text-muted-foreground">
            Staff
          </Link>
          <Link href="/dashboard/leaderboard" className="text-sm font-medium text-muted-foreground">
            Leaderboard
          </Link>
          <Bell className="h-5 w-5 text-muted-foreground" />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
