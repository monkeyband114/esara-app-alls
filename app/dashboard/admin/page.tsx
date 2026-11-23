import Link from "next/link";
import { Download, KeyRound, Settings, ShieldCheck, UserCog, UserPlus } from "lucide-react";
import { AdminUserControls } from "@/components/admin-user-controls";
import { DepartmentChart } from "@/components/charts";
import { MetricCard } from "@/components/metric-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Td, Th, Table } from "@/components/ui/table";
import { dashboardMetrics, departmentPerformance } from "@/lib/analytics";
import { listAuditLogs, listPublications, listScores, listUsers, roleLabel } from "@/lib/repository";
import { requirePageUser } from "@/lib/session";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const admin = await requirePageUser(["SUPER_ADMIN"]);
  const [{ created }, users, publications, scores, audits] = await Promise.all([searchParams, listUsers(), listPublications(), listScores(), listAuditLogs()]);
  const metrics = dashboardMetrics(users, publications, scores);
  const pending = publications.filter((publication) => publication.verificationStatus !== "VERIFIED").length;
  const averageCitations = scores.length ? scores.reduce((sum, score) => sum + score.citationCount, 0) / scores.length : 0;
  const averageH = scores.length ? scores.reduce((sum, score) => sum + score.hIndex, 0) / scores.length : 0;
  const sortedUsers = [...users].sort((a, b) => a.role.localeCompare(b.role) || a.fullName.localeCompare(b.fullName));

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Admin Research Oversight Center</h1>
          <p className="text-sm text-muted-foreground">Institution-wide controls for users, rankings, audit logs, departments, and research performance.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/admin/users/new" className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
            <UserPlus className="h-4 w-4" /> Create Account
          </Link>
          <a href="/api/reports/csv" download className="inline-flex h-10 items-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-primary ring-1 ring-border">
            <Download className="h-4 w-4" /> Export CSV
          </a>
        </div>
      </section>

      {created ? <p role="status" className="rounded-md border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success">Account created.</p> : null}

      <section className="dashboard-grid">
        <MetricCard title="Academic Staff" value={String(metrics.staffCount)} icon={UserCog} />
        <MetricCard title="Total Publications" value={String(metrics.publicationCount)} icon={Settings} />
        <MetricCard title="Verified Publications" value={String(metrics.verifiedCount)} icon={ShieldCheck} />
        <MetricCard title="Pending Verifications" value={String(pending)} icon={KeyRound} />
        <MetricCard title="Average Institutional SRS" value={metrics.averageSrs.toFixed(1)} icon={ShieldCheck} />
        <MetricCard title="Average Citation Count" value={averageCitations.toFixed(1)} icon={Settings} />
        <MetricCard title="Average h-index" value={averageH.toFixed(1)} icon={UserCog} />
      </section>

      <Card>
        <CardHeader><CardTitle>User, Role, and Account Controls</CardTitle></CardHeader>
        <CardContent>
          {/* Phones: one card per user so the controls are visible without scrolling sideways. */}
          <div className="space-y-3 md:hidden">
            {sortedUsers.map((user) => (
              <div key={user.id} className="rounded-lg border bg-white p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    {user.role === "ACADEMIC_STAFF" ? <Link href={`/dashboard/staff/${user.id}`} className="font-semibold text-primary">{user.fullName}</Link> : <span className="font-semibold">{user.fullName}</span>}
                    <div className="break-all text-xs text-muted-foreground">{user.email}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{roleLabel(user.role)} · {user.department}</div>
                  </div>
                  {user.suspended ? <Badge className="bg-orange-100 text-orange-800">Suspended</Badge> : null}
                </div>
                <div className="mt-3 border-t pt-3">
                  <AdminUserControls user={{ id: user.id, fullName: user.fullName, role: user.role, suspended: user.suspended }} isSelf={user.id === admin.id} />
                </div>
              </div>
            ))}
          </div>
          <div className="hidden md:block">
          <Table className="min-w-[720px]">
            <thead><tr><Th>Name</Th><Th>Role</Th><Th>Department</Th><Th>Controls</Th></tr></thead>
            <tbody>
              {sortedUsers.map((user) => (
                <tr key={user.id}>
                  <Td>
                    {user.role === "ACADEMIC_STAFF" ? <Link href={`/dashboard/staff/${user.id}`} className="font-semibold text-primary">{user.fullName}</Link> : <span className="font-semibold">{user.fullName}</span>}
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                    {user.suspended ? <Badge className="mt-1 bg-orange-100 text-orange-800">Suspended</Badge> : null}
                  </Td>
                  <Td>{roleLabel(user.role)}</Td>
                  <Td>{user.department}</Td>
                  <Td><AdminUserControls user={{ id: user.id, fullName: user.fullName, role: user.role, suspended: user.suspended }} isSelf={user.id === admin.id} /></Td>
                </tr>
              ))}
            </tbody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Department Rankings</CardTitle></CardHeader>
          <CardContent><DepartmentChart data={departmentPerformance(users, scores)} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top Performing Staff</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <thead><tr><Th>Rank</Th><Th>Staff</Th><Th>SRS</Th><Th>Citations</Th><Th>h-index</Th></tr></thead>
              <tbody>{scores.slice(0, 5).map((score) => {
                const user = users.find((item) => item.id === score.userId);
                return (
                  <tr key={score.id}>
                    <Td>{score.rankLabel}</Td>
                    <Td>{user ? <Link href={`/dashboard/staff/${user.id}`} className="font-semibold text-primary">{user.fullName}</Link> : "Unknown"}</Td>
                    <Td>{score.totalSRS.toFixed(1)}</Td>
                    <Td>{score.citationCount}</Td>
                    <Td>{score.hIndex}</Td>
                  </tr>
                );
              })}</tbody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader><CardTitle>Audit Logs</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {audits.slice(0, 12).map((audit) => (
            <p className="break-words text-sm" key={audit.id}>
              {audit.action}
              <span className="block text-xs text-muted-foreground">{new Date(audit.timestamp).toLocaleString()} · {users.find((user) => user.id === audit.performedBy)?.fullName ?? audit.performedBy}</span>
            </p>
          ))}
          {!audits.length ? <p className="text-sm text-muted-foreground">No audit entries yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
