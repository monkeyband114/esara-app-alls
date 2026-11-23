import Link from "next/link";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { globalSearch } from "@/lib/search";
import { requirePageUser } from "@/lib/session";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requirePageUser();
  const { q = "" } = await searchParams;
  const results = await globalSearch(q);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <form action="/dashboard/search" role="search" className="relative">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input name="q" defaultValue={q} aria-label="Search staff and publications" placeholder="Search staff, publications, journals" className="pl-9" />
      </form>
      <Card>
        <CardHeader>
          <CardTitle>{q ? `Results for "${q}"` : "Search ESARA"}</CardTitle>
          <p className="text-sm text-muted-foreground">{q ? `${results.length} matching staff and publications.` : "Find staff by name, email, or department, and publications by title, journal, or author."}</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {results.map((result, index) => {
            const body = (
              <>
                <Badge className="bg-primary/10 text-primary">{result.type}</Badge>
                <p className="mt-2 break-words font-semibold">{result.title}</p>
                <p className="break-words text-sm text-muted-foreground">{result.subtitle}</p>
              </>
            );
            return result.href ? (
              <Link key={index} href={result.href} className="block rounded-lg border bg-white p-4 hover:border-primary">{body}</Link>
            ) : (
              <div key={index} className="rounded-lg border bg-white p-4">{body}</div>
            );
          })}
          {q && !results.length ? <p className="text-sm text-muted-foreground">Nothing matched. Try a shorter or different search.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
