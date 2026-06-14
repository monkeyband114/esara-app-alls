import Link from "next/link";
import { ResearchDiscoveryClient } from "@/components/research-discovery-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResearchDiscoveryPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm font-semibold text-primary">ESARA</Link>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>OpenAlex Research Discovery</CardTitle>
            <p className="text-sm text-muted-foreground">Search, select, import, and claim publications for an academic profile.</p>
          </CardHeader>
          <CardContent>
            <ResearchDiscoveryClient />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
