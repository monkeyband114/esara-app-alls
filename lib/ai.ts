import type { Publication, ResearchScore, User } from "@/lib/types";

export async function explainResearchScore(user: User, publications: Publication[], score?: ResearchScore) {
  const prompt = `Explain ${user.fullName}'s ESARA Staff Research Score using publications=${publications.length}, citations=${publications.reduce(
    (sum, publication) => sum + publication.citations,
    0
  )}, SRS=${score?.totalSRS ?? 0}. Include ranking improvement suggestions.`;
  if (!process.env.OPENAI_API_KEY) {
    return "AI assistant is ready, but OPENAI_API_KEY is not configured. Improve ranking by increasing verified Q1/Q2 publications, citation visibility, and author identity consistency.";
  }
  const response = await fetch(`${process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1"}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      messages: [
        { role: "system", content: "You are ESARA's academic research performance assistant. Be specific, fair, and concise." },
        { role: "user", content: prompt }
      ]
    })
  });
  if (!response.ok) return "AI assistant could not generate guidance right now.";
  const body = await response.json();
  return body.choices?.[0]?.message?.content ?? "No guidance returned.";
}
