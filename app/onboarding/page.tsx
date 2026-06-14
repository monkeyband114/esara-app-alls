import Link from "next/link";
import { CheckCircle2, Gauge, Search, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
  "Profile Created",
  "Research Profile Discovery",
  "Publication Retrieval",
  "Research Score Computation",
  "Promotion Assessment",
  "Dashboard Ready"
];

export default function OnboardingPage({ searchParams }: { searchParams: Promise<{ userId?: string; mode?: string }> }) {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground"><Sparkles className="h-6 w-6" /></div>
          <CardTitle>Welcome to ESARA</CardTitle>
          <p className="text-sm text-muted-foreground">Your academic profile is being enriched with OpenAlex publication records, citation metrics, SRS computation, and promotion-readiness indicators.</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center gap-3 rounded-lg border bg-white p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">{index < 5 ? <CheckCircle2 className="h-5 w-5" /> : <Gauge className="h-5 w-5" />}</div>
                <div className="flex-1">
                  <p className="font-semibold">{step}</p>
                  <div className="mt-2 h-1.5 rounded bg-muted"><div className="h-1.5 rounded bg-primary" style={{ width: `${Math.min(100, (index + 1) * 18)}%` }} /></div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 md:grid-cols-3">
            <div><p className="text-xs text-muted-foreground">Current Rank</p><p className="font-bold text-primary">Calculating</p></div>
            <div><p className="text-xs text-muted-foreground">Research Score</p><p className="font-bold text-primary">Computing SRS</p></div>
            <div><p className="text-xs text-muted-foreground">Promotion Readiness</p><p className="font-bold text-primary">Assessing</p></div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/staff" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Open Staff Dashboard</Link>
            <Link href="/research-discovery" className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-primary ring-1 ring-border"><Search className="h-4 w-4" /> Manual Research Discovery</Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
