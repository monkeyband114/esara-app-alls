import type { Publication, ResearchScore, User } from "@/lib/types";

export function dashboardMetrics(users: User[], publications: Publication[], scores: ResearchScore[]) {
  const staff = users.filter((user) => user.role === "ACADEMIC_STAFF");
  const verified = publications.filter((publication) => publication.verificationStatus === "VERIFIED");
  return {
    staffCount: staff.length,
    publicationCount: publications.length,
    verifiedCount: verified.length,
    averageSrs: scores.length ? scores.reduce((sum, score) => sum + score.totalSRS, 0) / scores.length : 0,
    citationCount: publications.reduce((sum, publication) => sum + publication.citations, 0)
  };
}

export function trendByYear(publications: Publication[]) {
  const years = Array.from(new Set(publications.map((publication) => publication.publicationYear))).sort();
  return years.map((year) => ({
    year,
    publications: publications.filter((publication) => publication.publicationYear === year).length,
    citations: publications.filter((publication) => publication.publicationYear === year).reduce((sum, publication) => sum + publication.citations, 0)
  }));
}

export function annualCitationGrowth(publications: Publication[]) {
  return trendByYear(publications).map((row) => ({ year: row.year, citations: row.citations }));
}

export function lecturerMetrics(users: User[], publications: Publication[], scores: ResearchScore[]) {
  return users
    .filter((user) => user.role === "ACADEMIC_STAFF")
    .map((user) => {
      const staffPublications = publications.filter((publication) => publication.userId === user.id);
      const score = scores.find((item) => item.userId === user.id);
      return {
        id: user.id,
        name: user.fullName.replace(/^Dr\s+/i, ""),
        publications: staffPublications.length,
        citations: staffPublications.reduce((sum, publication) => sum + publication.citations, 0),
        hIndex: score?.hIndex ?? 0,
        srs: Number((score?.totalSRS ?? 0).toFixed(1)),
        journalQuality: Number(((score?.journalQualityScore ?? 0) * 100).toFixed(1)),
        researchImpact: Number(((score?.researchImpactScore ?? 0) * 100).toFixed(1))
      };
    });
}

export function researchAreaDistribution(publications: Publication[]) {
  const counts = publications.reduce<Record<string, number>>((acc, publication) => {
    const area = publication.researchArea ?? "Unclassified";
    acc[area] = (acc[area] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

export function departmentContribution(users: User[], publications: Publication[]) {
  return Array.from(new Set(users.filter((user) => user.role === "ACADEMIC_STAFF").map((user) => user.department))).map((department) => {
    const members = users.filter((user) => user.department === department);
    const departmentPublications = publications.filter((publication) => members.some((user) => user.id === publication.userId));
    return {
      name: department,
      size: departmentPublications.reduce((sum, publication) => sum + publication.citations + 1, 0),
      publications: departmentPublications.length
    };
  });
}

export function departmentPerformance(users: User[], scores: ResearchScore[]) {
  return Array.from(new Set(users.map((user) => user.department))).map((department) => {
    const members = users.filter((user) => user.department === department);
    const memberScores = scores.filter((score) => members.some((user) => user.id === score.userId));
    return {
      department,
      srs: memberScores.length ? Number((memberScores.reduce((sum, score) => sum + score.totalSRS, 0) / memberScores.length).toFixed(2)) : 0
    };
  });
}

export function peerComparison(userId: string, users: User[], publications: Publication[], scores: ResearchScore[]) {
  const rows = lecturerMetrics(users, publications, scores);
  const current = rows.find((row) => row.id === userId) ?? rows[0];
  const top = [...rows].sort((a, b) => b.srs - a.srs)[0];
  const average = {
    id: "institution-average",
    name: "Institution Average",
    publications: averageOf(rows, "publications"),
    citations: averageOf(rows, "citations"),
    hIndex: averageOf(rows, "hIndex"),
    srs: averageOf(rows, "srs"),
    journalQuality: averageOf(rows, "journalQuality"),
    researchImpact: averageOf(rows, "researchImpact")
  };
  return { current, average, top };
}

export function srsContributions(score?: ResearchScore) {
  if (!score) return [];
  return [
    { name: "Publication", weight: 25, value: Number((score.publicationScore * 25).toFixed(1)) },
    { name: "Citation", weight: 35, value: Number((score.citationScore * 35).toFixed(1)) },
    { name: "h-index", weight: 25, value: Number((score.hIndexScore * 25).toFixed(1)) },
    { name: "Journal Quality", weight: 15, value: Number((score.journalQualityScore * 15).toFixed(1)) }
  ];
}

function averageOf(rows: Array<Record<string, string | number>>, key: string) {
  return rows.length ? Number((rows.reduce((sum, row) => sum + Number(row[key] ?? 0), 0) / rows.length).toFixed(1)) : 0;
}
