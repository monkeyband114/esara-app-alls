import { BookOpen, CheckCircle2, Clock3, Quote, TrendingUp, Users } from "lucide-react";
import {
  AnnualCitationAreaChart,
  AreaDistributionChart,
  DepartmentChart,
  DepartmentTreemap,
  LecturerBarChart,
  PerformanceRadarChart,
  TrendChart
} from "@/components/charts";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Td, Th, Table } from "@/components/ui/table";
import {
  annualCitationGrowth,
  dashboardMetrics,
  departmentContribution,
  departmentPerformance,
  lecturerMetrics,
  peerComparison,
  researchAreaDistribution
} from "@/lib/analytics";
import { listPublications, listScores, listUsers } from "@/lib/repository";

export default async function DashboardPage() {
  const [users, publications, scores] = await Promise.all([listUsers(), listPublications(), listScores()]);
  const metrics = dashboardMetrics(users, publications, scores);
  const lecturerRows = lecturerMetrics(users, publications, scores);
  const firstStaff = lecturerRows[0];
  const comparison = peerComparison(firstStaff?.id ?? "", users, publications, scores);
  const radar = [
    { metric: "Publications", current: comparison.current.publications, average: comparison.average.publications, top: comparison.top.publications },
    { metric: "Citations", current: comparison.current.citations, average: comparison.average.citations, top: comparison.top.citations },
    { metric: "h-index", current: comparison.current.hIndex, average: comparison.average.hIndex, top: comparison.top.hIndex },
    { metric: "SRS", current: comparison.current.srs, average: comparison.average.srs, top: comparison.top.srs },
    { metric: "Journal", current: comparison.current.journalQuality, average: comparison.average.journalQuality, top: comparison.top.journalQuality }
  ];
  const pending = publications.filter((publication) => publication.verificationStatus !== "VERIFIED").length;
  const topStaff = scores.slice(0, 5).map((score) => ({ score, user: users.find((user) => user.id === score.userId) }));

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-normal">Institution Research Intelligence</h1>
        <p className="mt-1 text-sm text-muted-foreground">Demo mode keeps rankings, charts, publications, citations, and verification queues populated automatically.</p>
      </section>
      <section className="dashboard-grid">
        <MetricCard title="Academic Staff" value={String(metrics.staffCount)} icon={Users} />
        <MetricCard title="Publications" value={String(metrics.publicationCount)} icon={BookOpen} />
        <MetricCard title="Verified Publications" value={String(metrics.verifiedCount)} icon={CheckCircle2} />
        <MetricCard title="Pending Verifications" value={String(pending)} icon={Clock3} />
        <MetricCard title="Average SRS" value={metrics.averageSrs.toFixed(1)} icon={TrendingUp} />
        <MetricCard title="Total Citations" value={String(metrics.citationCount)} icon={Quote} />
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        <Card><CardHeader><CardTitle>Research Growth Over Time</CardTitle></CardHeader><CardContent><TrendChart data={annualCitationGrowth(publications).map((row) => ({ ...row, publications: publications.filter((publication) => publication.publicationYear === row.year).length }))} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Annual Citation Growth</CardTitle></CardHeader><CardContent><AnnualCitationAreaChart data={annualCitationGrowth(publications)} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Publications Per Lecturer</CardTitle></CardHeader><CardContent><LecturerBarChart data={lecturerRows} metric="publications" /></CardContent></Card>
        <Card><CardHeader><CardTitle>Citation Counts Per Lecturer</CardTitle></CardHeader><CardContent><LecturerBarChart data={lecturerRows} metric="citations" /></CardContent></Card>
        <Card><CardHeader><CardTitle>Research Area Distribution</CardTitle></CardHeader><CardContent><AreaDistributionChart data={researchAreaDistribution(publications)} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Research Performance Metrics</CardTitle></CardHeader><CardContent><PerformanceRadarChart data={radar} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Department Rankings</CardTitle></CardHeader><CardContent><DepartmentChart data={departmentPerformance(users, scores)} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Department Contribution Analysis</CardTitle></CardHeader><CardContent><DepartmentTreemap data={departmentContribution(users, publications)} /></CardContent></Card>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Institution-wide Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <thead><tr><Th>Rank</Th><Th>Name</Th><Th>Department</Th><Th>SRS</Th><Th>Citations</Th><Th>h-index</Th></tr></thead>
            <tbody>
              {topStaff.map(({ score, user }) => (
                <tr key={score.id}>
                  <Td>{score.rankLabel}</Td>
                  <Td>{user?.fullName}</Td>
                  <Td>{user?.department}</Td>
                  <Td>{score.totalSRS.toFixed(1)}</Td>
                  <Td>{score.citationCount}</Td>
                  <Td>{score.hIndex}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
