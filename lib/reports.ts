import type { Publication, ResearchScore, User } from "@/lib/types";

export function toCsv(users: User[], publications: Publication[], scores: ResearchScore[]) {
  const rows = [["Name", "Email", "Department", "Publications", "Citations", "SRS", "Ranking"]];
  for (const user of users.filter((row) => row.role === "ACADEMIC_STAFF")) {
    const staffPublications = publications.filter((publication) => publication.userId === user.id);
    const score = scores.find((item) => item.userId === user.id);
    rows.push([
      user.fullName,
      user.email,
      user.department,
      String(staffPublications.length),
      String(staffPublications.reduce((sum, publication) => sum + publication.citations, 0)),
      String(score?.totalSRS.toFixed(3) ?? "0"),
      String(score?.ranking ?? "")
    ]);
  }
  return rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
}
