import { AppShell } from "@/components/app-shell";
import { ResearchDiscoveryClient } from "@/components/research-discovery-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePageUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ResearchDiscoveryPage() {
  const user = await requirePageUser();

  return (
    <AppShell>
      <Card className="mx-auto max-w-6xl">
        <CardHeader>
          <CardTitle>OpenAlex Research Discovery</CardTitle>
          <p className="text-sm text-muted-foreground">Search OpenAlex by publication, author, DOI, journal, or institution, then import your publications.</p>
        </CardHeader>
        <CardContent>
          <ResearchDiscoveryClient canImport={user.role === "ACADEMIC_STAFF"} />
        </CardContent>
      </Card>
    </AppShell>
  );
}
