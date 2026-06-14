import type { Publication, ResearchScore, StaffRanking, SystemSettings, User } from "@/lib/types";

const quartileScore = { Q1: 1, Q2: 0.75, Q3: 0.5, Q4: 0.25 };

export function hIndexFromPublications(publications: Publication[]) {
  const sorted = publications.map((publication) => publication.citations).sort((a, b) => b - a);
  return sorted.reduce((h, citations, index) => (citations >= index + 1 ? index + 1 : h), 0);
}

export function calculateScores(users: User[], publications: Publication[], settings: SystemSettings): ResearchScore[] {
  const academicUsers = users.filter((user) => user.role === "ACADEMIC_STAFF");
  const aggregates = academicUsers.map((user) => {
    const staffPublications = publications.filter((publication) => publication.userId === user.id && publication.verificationStatus !== "REJECTED");
    const citationCount = staffPublications.reduce((sum, publication) => sum + publication.citations, 0);
    const hIndex = hIndexFromPublications(staffPublications);
    const journalQuality = staffPublications.reduce((sum, publication) => sum + quartileScore[publication.quartile] * publication.impactFactor, 0);
    const researchImpact = staffPublications.reduce((sum, publication) => sum + (publication.impactScore ?? publication.impactFactor + publication.citations / 10), 0);
    return { user, publicationCount: staffPublications.length, citationCount, hIndex, journalQuality, researchImpact };
  });

  const maxPublications = Math.max(...aggregates.map((row) => row.publicationCount), 1);
  const maxCitations = Math.max(...aggregates.map((row) => row.citationCount), 1);
  const maxHIndex = Math.max(...aggregates.map((row) => row.hIndex), 1);
  const maxJournalQuality = Math.max(...aggregates.map((row) => row.journalQuality), 1);
  const maxResearchImpact = Math.max(...aggregates.map((row) => row.researchImpact), 1);

  const weighted = aggregates.map((row) => {
    const publicationScore = row.publicationCount / maxPublications;
    const citationScore = row.citationCount / maxCitations;
    const hIndexScore = row.hIndex / maxHIndex;
    const journalQualityScore = row.journalQuality / maxJournalQuality;
    const researchImpactScore = row.researchImpact / maxResearchImpact;
    const totalSRS = 100 * (
      settings.scoreWeights.publications * publicationScore +
      settings.scoreWeights.citations * citationScore +
      settings.scoreWeights.hIndex * hIndexScore +
      settings.scoreWeights.journalQuality * journalQualityScore
    );
    return {
      id: `score:${row.user.id}`,
      userId: row.user.id,
      publicationScore,
      citationScore,
      hIndexScore,
      journalQualityScore,
      researchImpactScore,
      citationCount: row.citationCount,
      publicationCount: row.publicationCount,
      hIndex: row.hIndex,
      journalQualityRaw: row.journalQuality,
      totalSRS,
      ranking: 0,
      rankLabel: ""
    };
  });

  return weighted
    .sort((a, b) => b.totalSRS - a.totalSRS || b.citationCount - a.citationCount || b.hIndex - a.hIndex)
    .map((score, index, all) => ({ ...score, ranking: index + 1, rankLabel: `Rank ${index + 1} of ${all.length}` }));
}

export function calculateStaffRankings(users: User[], publications: Publication[], scores: ResearchScore[]): StaffRanking[] {
  const academicUsers = users.filter((user) => user.role === "ACADEMIC_STAFF");
  return scores
    .filter((score) => academicUsers.some((user) => user.id === score.userId))
    .sort((a, b) => b.totalSRS - a.totalSRS || b.citationCount - a.citationCount || b.hIndex - a.hIndex)
    .map((score, index, all) => {
      const recentPublications = publications.filter((publication) => publication.userId === score.userId && publication.publicationYear >= new Date().getFullYear() - 2);
      const trendScore = recentPublications.reduce((sum, publication) => sum + publication.citations + 5, 0);
      return {
        id: `ranking:${score.userId}`,
        userId: score.userId,
        rank: index + 1,
        total: all.length,
        srs: score.totalSRS,
        citationCount: score.citationCount,
        hIndex: score.hIndex,
        publicationCount: score.publicationCount,
        trendScore,
        updatedAt: new Date().toISOString()
      };
    });
}
