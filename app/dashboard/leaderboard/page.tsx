import { Award, Flame, Quote, TrendingUp, Trophy } from "lucide-react";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { MetricCard } from "@/components/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listRankings, listUsers } from "@/lib/repository";
import { requirePageUser } from "@/lib/session";

export default async function LeaderboardPage() {
  await requirePageUser();
  const [users, rankings] = await Promise.all([listUsers(), listRankings()]);
  const rows = rankings.map((ranking) => {
    const user = users.find((item) => item.id === ranking.userId);
    return {
      id: ranking.userId,
      name: user?.fullName ?? ranking.userId,
      department: user?.department ?? "Unknown",
      faculty: user?.faculty ?? "Unknown",
      rank: ranking.rank,
      srs: ranking.srs,
      citations: ranking.citationCount,
      hIndex: ranking.hIndex,
      publications: ranking.publicationCount,
      trendScore: ranking.trendScore
    };
  });
  const top = rows[0];
  const bottom = rows[rows.length - 1];
  const mostCited = [...rows].sort((a, b) => b.citations - a.citations)[0];
  const highestH = [...rows].sort((a, b) => b.hIndex - a.hIndex)[0];
  const fastest = [...rows].sort((a, b) => b.trendScore - a.trendScore)[0];

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold">Institution Research Ranking</h1>
        <p className="text-sm text-muted-foreground">Rankings are ordered by SRS, then citation count, then h-index.</p>
      </section>
      <section className="dashboard-grid">
        <MetricCard title="Top Researcher" value={top?.name ?? "-"} detail={`SRS ${top?.srs.toFixed(1) ?? "0"}`} icon={Trophy} />
        <MetricCard title="Bottom Researcher" value={bottom?.name ?? "-"} detail={`SRS ${bottom?.srs.toFixed(1) ?? "0"}`} icon={Award} />
        <MetricCard title="Fastest Growing" value={fastest?.name ?? "-"} detail={`Growth ${fastest?.trendScore ?? 0}`} icon={Flame} />
        <MetricCard title="Most Cited" value={mostCited?.name ?? "-"} detail={`${mostCited?.citations ?? 0} citations`} icon={Quote} />
        <MetricCard title="Highest h-index" value={highestH?.name ?? "-"} detail={`h-index ${highestH?.hIndex ?? 0}`} icon={TrendingUp} />
      </section>
      <Card>
        <CardHeader><CardTitle>Search, Filter, Sort, and Paginate</CardTitle></CardHeader>
        <CardContent><LeaderboardTable rows={rows} /></CardContent>
      </Card>
    </div>
  );
}
