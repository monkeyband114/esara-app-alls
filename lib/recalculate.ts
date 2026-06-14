import { getSettings, listPublications, listUsers, saveRankings, saveScores } from "@/lib/repository";
import { calculateScores, calculateStaffRankings } from "@/lib/scoring";

export async function recalculateInstitutionMetrics() {
  const [users, publications, settings] = await Promise.all([listUsers(), listPublications(), getSettings()]);
  const scores = calculateScores(users, publications, settings);
  await saveScores(scores);
  await saveRankings(calculateStaffRankings(users, publications, scores));
  return { users, publications, scores };
}
