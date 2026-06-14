import { calculateScores } from "@/lib/scoring";
import { calculateStaffRankings } from "@/lib/scoring";
import { publications, settings, users } from "@/lib/sample-data";
import { saveRankings, saveScores, saveSettings, upsertPublication, upsertUser } from "@/lib/repository";

const defaultPasswords: Record<string, string> = {
  "admin@esara.edu": "Admin123@",
  "ict@esara.edu": "ICT123@",
  "arnold.ojugo@esara.edu": "Staff123@",
  "maureen.akazwe@esara.edu": "Staff123@",
  "patrick.ejeh@esara.edu": "Staff123@"
};

async function main() {
  await saveSettings(settings);
  for (const user of users) {
    await upsertUser({ ...user, password: defaultPasswords[user.email] ?? "Staff123@" });
  }
  for (const publication of publications) {
    await upsertPublication(publication);
  }
  const scores = calculateScores(users, publications, settings);
  await saveScores(scores);
  await saveRankings(calculateStaffRankings(users, publications, scores));
  console.log("ESARA users seeded. Publication records are not generated; run OpenAlex import to populate publications.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
