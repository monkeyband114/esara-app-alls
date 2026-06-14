import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Quote, ShieldCheck, TrendingUp, Trophy } from "lucide-react";
import {
  AreaDistributionChart,
  ContributionBars,
  PerformanceRadarChart,
  QuartileChart,
  TrendChart
} from "@/components/charts";
import { MetricCard } from "@/components/metric-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Td, Th, Table } from "@/components/ui/table";
import { peerComparison, researchAreaDistribution, srsContributions, trendByYear } from "@/lib/analytics";
import { listPublications, listRankings, listScores, listUsers } from "@/lib/repository";
import { hIndexFromPublications } from "@/lib/scoring";

function indicator(value: number, average: number) {
  if (value > average * 1.08) return { label: "Above Average", className: "bg-emerald-100 text-emerald-800" };
  if (value < average * 0.92) return { label: "Below Average", className: "bg-orange-100 text-orange-800" };
  return { label: "Average", className: "bg-blue-100 text-blue-800" };
}

export default async function StaffAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [users, allPublications, scores, rankings] = await Promise.all([listUsers(), listPublications(), listScores(), listRankings()]);
  const user = users.find((item) => item.id === id && item.role === "ACADEMIC_STAFF");
  if (!user) notFound();

  const publications = allPublications.filter((publication) => publication.userId === user.id);
  const score = scores.find((item) => item.userId === user.id);
  const ranking = rankings.find((item) => item.userId === user.id);
  const comparison = peerComparison(user.id, users, allPublications, scores);
  const citations = publications.reduce((sum, publication) => sum + publication.citations, 0);
  const verified = publications.filter((publication) => publication.verificationStatus === "VERIFIED").length;
  const contributions = srsContributions(score);
  const radar = [
    { metric: "Publications", current: comparison.current.publications, average: comparison.average.publications, top: comparison.top.publications },
    { metric: "Citations", current: comparison.current.citations, average: comparison.average.citations, top: comparison.top.citations },
    { metric: "h-index", current: comparison.current.hIndex, average: comparison.average.hIndex, top: comparison.top.hIndex },
    { metric: "SRS", current: comparison.current.srs, average: comparison.average.srs, top: comparison.top.srs },
    { metric: "Impact", current: comparison.current.researchImpact, average: comparison.average.researchImpact, top: comparison.top.researchImpact }
  ];
  const quartiles = ["Q1", "Q2", "Q3", "Q4"].map((quartile) => ({ name: quartile, value: publications.filter((publication) => publication.quartile === quartile).length }));

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-lg bg-primary text-xl font-bold text-primary-foreground">{user.profilePhoto ?? user.fullName.slice(0, 2)}</div>
          <div>
            <h1 className="text-2xl font-bold">{user.fullName}</h1>
            <p className="text-sm text-muted-foreground">{user.department} · {user.faculty} · {user.institution}</p>
            <p className="mt-1 text-sm font-semibold text-primary">{ranking ? `Rank ${ranking.rank} of ${ranking.total}` : score?.rankLabel}</p>
          </div>
        </div>
        <Link href="/dashboard/leaderboard" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">View Leaderboard</Link>
      </section>

      <section className="dashboard-grid">
        <MetricCard title="Current SRS Score" value={(score?.totalSRS ?? 0).toFixed(1)} icon={Trophy} />
        <MetricCard title="Current h-index" value={String(score?.hIndex ?? hIndexFromPublications(publications))} icon={TrendingUp} />
        <MetricCard title="Total Citations" value={String(citations)} icon={Quote} />
        <MetricCard title="Total Publications" value={String(publications.length)} icon={BookOpen} />
        <MetricCard title="Verification Status" value={`${verified}/${publications.length}`} detail="Verified publications" icon={ShieldCheck} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card><CardHeader><CardTitle>Publication Timeline and Research Growth</CardTitle></CardHeader><CardContent><TrendChart data={trendByYear(publications)} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Research Area Distribution</CardTitle></CardHeader><CardContent><AreaDistributionChart data={researchAreaDistribution(publications)} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Peer Comparison</CardTitle></CardHeader><CardContent><PerformanceRadarChart data={radar} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Journal Quality Mix</CardTitle></CardHeader><CardContent><QuartileChart data={quartiles} /></CardContent></Card>
      </section>

      <Card>
        <CardHeader><CardTitle>Peer Comparison Table</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <thead><tr><Th>Metric</Th><Th>Current User</Th><Th>Institution Average</Th><Th>Top Performer</Th><Th>Status</Th></tr></thead>
            <tbody>
              {[
                ["Publication Count", comparison.current.publications, comparison.average.publications, comparison.top.publications],
                ["Citation Count", comparison.current.citations, comparison.average.citations, comparison.top.citations],
                ["h-index", comparison.current.hIndex, comparison.average.hIndex, comparison.top.hIndex],
                ["SRS Score", comparison.current.srs, comparison.average.srs, comparison.top.srs],
                ["Journal Quality Score", comparison.current.journalQuality, comparison.average.journalQuality, comparison.top.journalQuality],
                ["Research Impact Score", comparison.current.researchImpact, comparison.average.researchImpact, comparison.top.researchImpact]
              ].map(([name, current, average, top]) => {
                const status = indicator(Number(current), Number(average));
                return <tr key={String(name)}><Td>{name}</Td><Td>{current}</Td><Td>{average}</Td><Td>{top}</Td><Td><Badge className={status.className}>{status.label}</Badge></Td></tr>;
              })}
            </tbody>
          </Table>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader><CardTitle>Why am I ranked here?</CardTitle></CardHeader>
          <CardContent>
            <ContributionBars data={contributions} />
            <p className="mt-4 text-sm font-semibold">Total SRS = {(score?.totalSRS ?? 0).toFixed(1)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>SRS Contribution Pie</CardTitle></CardHeader>
          <CardContent><QuartileChart data={contributions.map((item) => ({ name: item.name, value: item.value }))} /></CardContent>
        </Card>
      </section>
    </div>
  );
}
