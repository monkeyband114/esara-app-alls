import Link from "next/link";
import { BookOpen, FileText, Lightbulb, Quote, TrendingUp, Trophy, UserRound } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { AreaDistributionChart, QuartileChart, TrendChart } from "@/components/charts";
import { MetricCard } from "@/components/metric-card";
import { StaffPublicationActions } from "@/components/staff-publication-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Td, Th, Table } from "@/components/ui/table";
import { researchAreaDistribution, trendByYear } from "@/lib/analytics";
import { listPublications, listRankings, listScores, listUsers } from "@/lib/repository";
import { requirePageUser } from "@/lib/session";

export default async function StaffPage() {
  const currentUser = await requirePageUser(["ACADEMIC_STAFF"]);
  const [users, allPublications, scores, rankings] = await Promise.all([listUsers(), listPublications(), listScores(), listRankings()]);

  const publications = allPublications.filter((publication) => publication.userId === currentUser.id);
  const score = scores.find((item) => item.userId === currentUser.id);
  const ranking = rankings.find((item) => item.userId === currentUser.id);
  const facultyUsers = users.filter((user) => user.role === "ACADEMIC_STAFF" && user.faculty === currentUser.faculty);
  const facultyScores = scores.filter((item) => facultyUsers.some((user) => user.id === item.userId));
  const facultyAverageSrs = facultyScores.length ? facultyScores.reduce((sum, item) => sum + item.totalSRS, 0) / facultyScores.length : 0;
  const citations = publications.reduce((sum, publication) => sum + publication.citations, 0);
  const quartiles = ["Q1", "Q2", "Q3", "Q4"].map((quartile) => ({
    name: quartile,
    value: publications.filter((publication) => publication.quartile === quartile).length
  }));

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={currentUser.fullName} photo={currentUser.profilePhoto} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary">Academic Staff Dashboard</p>
            <h1 className="text-2xl font-bold">{currentUser.fullName}</h1>
            <p className="break-words text-sm text-muted-foreground">{currentUser.department} · {currentUser.faculty} · {currentUser.institution}</p>
          </div>
        </div>
        <Link href={`/dashboard/staff/${currentUser.id}`} className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-primary ring-1 ring-border">
          Full Analytics Profile
        </Link>
      </section>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-5">
          <div>
            <h2 className="text-xl font-bold">Welcome to ESARA</h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              This is your research workspace: import OpenAlex publications, add OpenAlex records by DOI/title, monitor your SRS, and compare your progress inside your faculty.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-3 text-primary">
            <Lightbulb className="h-5 w-5" />
            <span className="text-sm font-semibold">Keep your OpenAlex author identity clean and consistent.</span>
          </div>
        </CardContent>
      </Card>

      <section className="dashboard-grid">
        <MetricCard title="Current SRS" value={(score?.totalSRS ?? 0).toFixed(1)} detail={ranking ? `Rank ${ranking.rank} of ${ranking.total}` : "Rank pending"} icon={Trophy} />
        <MetricCard title="Total Publications" value={String(publications.length)} detail="OpenAlex records only" icon={BookOpen} />
        <MetricCard title="Total Citations" value={String(citations)} icon={Quote} />
        <MetricCard title="h-index" value={String(score?.hIndex ?? 0)} icon={TrendingUp} />
        <MetricCard title="Faculty Avg SRS" value={facultyAverageSrs.toFixed(1)} icon={UserRound} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader><CardTitle>Publication Management</CardTitle></CardHeader>
          <CardContent><StaffPublicationActions userId={currentUser.id} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>My Profile Data</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 text-sm md:grid-cols-2">
              <p className="break-all"><span className="font-semibold">Email:</span> {currentUser.email}</p>
              <p><span className="font-semibold">Department:</span> {currentUser.department}</p>
              <p><span className="font-semibold">Faculty:</span> {currentUser.faculty}</p>
              <p><span className="font-semibold">Institution:</span> {currentUser.institution}</p>
              <p><span className="font-semibold">ORCID:</span> {currentUser.orcidId || "Not added"}</p>
              <p><span className="font-semibold">Research Area:</span> {currentUser.researchArea || "OpenAlex indexed research"}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Publication and Citation Timeline</CardTitle></CardHeader>
          <CardContent><TrendChart data={trendByYear(publications)} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Journal Quality</CardTitle></CardHeader>
          <CardContent><QuartileChart data={quartiles} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Research Area Distribution</CardTitle></CardHeader>
          <CardContent><AreaDistributionChart data={researchAreaDistribution(publications)} /></CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Faculty Context</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <thead><tr><Th>Staff</Th><Th>Department</Th><Th>Publications</Th><Th>Citations</Th><Th>SRS</Th><Th>Rank</Th></tr></thead>
              <tbody>
                {facultyUsers.map((user) => {
                  const userScore = scores.find((item) => item.userId === user.id);
                  return (
                    <tr key={user.id}>
                      <Td>{user.fullName}{user.id === currentUser.id ? <Badge className="ml-2 bg-primary/10 text-primary">You</Badge> : null}</Td>
                      <Td>{user.department}</Td>
                      <Td>{userScore?.publicationCount ?? 0}</Td>
                      <Td>{userScore?.citationCount ?? 0}</Td>
                      <Td>{(userScore?.totalSRS ?? 0).toFixed(1)}</Td>
                      <Td>{userScore?.rankLabel ?? "Pending"}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> My OpenAlex Publications</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <thead><tr><Th>Title</Th><Th>Journal</Th><Th>Year</Th><Th>Citations</Th><Th>Verification</Th></tr></thead>
            <tbody>
              {publications.slice(0, 20).map((publication) => (
                <tr key={publication.id}>
                  <Td>{publication.title}<div className="text-xs text-muted-foreground">{publication.doi}</div></Td>
                  <Td>{publication.journal}<div className="text-xs text-muted-foreground">{publication.researchArea}</div></Td>
                  <Td>{publication.publicationYear}</Td>
                  <Td>{publication.citations}</Td>
                  <Td><Badge className="bg-primary/10 text-primary">{publication.verificationStatus.replace("_", " ")}</Badge></Td>
                </tr>
              ))}
              {!publications.length ? (
                <tr><Td colSpan={5} className="text-center text-muted-foreground">No OpenAlex publications imported yet. Use the controls above to import your records.</Td></tr>
              ) : null}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
