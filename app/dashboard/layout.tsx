import { AppShell } from "@/components/app-shell";

// Dashboards show live, per-user data. Without this Vercel prerenders them at build time,
// freezing the sample data and ignoring every import that happens afterwards.
export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
