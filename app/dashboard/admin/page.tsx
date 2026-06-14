import { Download, KeyRound, Settings, ShieldCheck, UserCog, UserPlus } from "lucide-react";
import { DepartmentChart } from "@/components/charts";
import { MetricCard } from "@/components/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Td, Th, Table } from "@/components/ui/table";
import { dashboardMetrics, departmentPerformance } from "@/lib/analytics";
import { listAuditLogs, listPublications, listScores, listUsers, roleLabel } from "@/lib/repository";

export default async function AdminPage() {
  const [users, publications, scores, audits] = await Promise.all([listUsers(), listPublications(), listScores(), listAuditLogs()]);
  const metrics = dashboardMetrics(users, publications, scores);
  const pending = publications.filter((publication) => publication.verificationStatus !== "VERIFIED").length;
  const averageCitations = scores.length ? scores.reduce((sum, score) => sum + score.citationCount, 0) / scores.length : 0;
  const averageH = scores.length ? scores.reduce((sum, score) => sum + score.hIndex, 0) / scores.length : 0;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Admin Research Oversight Center</h1>
          <p className="text-sm text-muted-foreground">Institution-wide controls for users, rankings, audit logs, departments, and research performance.</p>
        </div>
        <div className="flex gap-2">
          <Button><UserPlus className="h-4 w-4" /> Create Account</Button>
          <Button className="bg-white text-primary ring-1 ring-border"><Download className="h-4 w-4" /> Export</Button>
        </div>
      </section>

      <section className="dashboard-grid">
        <MetricCard title="Academic Staff" value={String(metrics.staffCount)} icon={UserCog} />
        <MetricCard title="Total Publications" value={String(metrics.publicationCount)} icon={Settings} />
        <MetricCard title="Verified Publications" value={String(metrics.verifiedCount)} icon={ShieldCheck} />
        <MetricCard title="Pending Verifications" value={String(pending)} icon={KeyRound} />
        <MetricCard title="Average Institutional SRS" value={metrics.averageSrs.toFixed(1)} icon={ShieldCheck} />
        <MetricCard title="Average Citation Count" value={averageCitations.toFixed(1)} icon={Settings} />
        <MetricCard title="Average h-index" value={averageH.toFixed(1)} icon={UserCog} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
        <Card>
          <CardHeader><CardTitle>User, Role, and Account Controls</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <thead><tr><Th>Name</Th><Th>Role</Th><Th>Department</Th><Th>Controls</Th></tr></thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <Td>{user.fullName}<div className="text-xs text-muted-foreground">{user.email}</div></Td>
                    <Td>{roleLabel(user.role)}</Td>
                    <Td>{user.department}</Td>
                    <Td className="text-xs text-muted-foreground">Edit · Reset Password · Suspend · Activate · Delete · Assign Role</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Department Rankings</CardTitle></CardHeader>
          <CardContent><DepartmentChart data={departmentPerformance(users, scores)} /></CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Top Performing Staff</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <thead><tr><Th>Rank</Th><Th>Staff</Th><Th>SRS</Th><Th>Citations</Th><Th>h-index</Th></tr></thead>
              <tbody>{scores.slice(0, 5).map((score) => {
                const user = users.find((item) => item.id === score.userId);
                return <tr key={score.id}><Td>{score.rankLabel}</Td><Td>{user?.fullName}</Td><Td>{score.totalSRS.toFixed(1)}</Td><Td>{score.citationCount}</Td><Td>{score.hIndex}</Td></tr>;
              })}</tbody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Audit Logs</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {audits.slice(0, 8).map((audit) => <p className="text-sm" key={audit.id}>{audit.action}<span className="block text-xs text-muted-foreground">{new Date(audit.timestamp).toLocaleString()}</span></p>)}
            {!audits.length ? <p className="text-sm text-muted-foreground">No audit entries yet.</p> : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
