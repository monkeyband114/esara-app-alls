import { Check, DatabaseZap, FileUp, SearchCheck, Settings2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Td, Th, Table } from "@/components/ui/table";
import { listPublications, listUsers } from "@/lib/repository";

function statusClass(status: string) {
  if (status === "VERIFIED") return "bg-emerald-100 text-emerald-800";
  if (status === "LIKELY_MATCH") return "bg-amber-100 text-amber-800";
  return "bg-orange-100 text-orange-800";
}

export default async function IctPage() {
  const [publications, users] = await Promise.all([listPublications(), listUsers()]);
  const queue = publications.filter((publication) => publication.verificationStatus !== "VERIFIED");
  const duplicates = publications.length - new Set(publications.map((publication) => publication.doi ?? publication.title)).size;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">ICT Research Management Center</h1>
          <p className="text-sm text-muted-foreground">Publication validation, OpenAlex synchronization, metadata correction, duplicate detection, and bulk import operations.</p>
        </div>
        <div className="flex gap-2">
          <Button><DatabaseZap className="h-4 w-4" /> OpenAlex Sync</Button>
          <Button className="bg-white text-primary ring-1 ring-border"><FileUp className="h-4 w-4" /> Bulk Upload</Button>
        </div>
      </section>
      <section className="dashboard-grid">
        <Card><CardHeader><CardTitle>Publication Validation Queue</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{queue.length}</CardContent></Card>
        <Card><CardHeader><CardTitle>Author Verification Queue</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{queue.filter((item) => item.verificationStatus === "MANUAL_REVIEW").length}</CardContent></Card>
        <Card><CardHeader><CardTitle>Duplicate Publications</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{duplicates}</CardContent></Card>
        <Card><CardHeader><CardTitle>Failed Retrieval Logs</CardTitle></CardHeader><CardContent className="text-3xl font-bold">0</CardContent></Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Settings2 className="h-4 w-4" /> Metadata Tools</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Correct titles, DOIs, journal names, categories, research areas, years, citations, and author order.</CardContent></Card>
        <Card><CardHeader><CardTitle>Journal Quality Assignment</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Assign Q1-Q4 quartiles, impact factor, impact score, and validation notes.</CardContent></Card>
        <Card><CardHeader><CardTitle>Manual Publication Entry</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Add records manually when OpenAlex has no matching publication data.</CardContent></Card>
      </section>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><SearchCheck className="h-4 w-4" /> Author Verification Center</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <thead><tr><Th>Publication</Th><Th>Authors</Th><Th>DOI</Th><Th>Confidence</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
            <tbody>
              {publications.slice(0, 20).map((publication) => (
                <tr key={publication.id}>
                  <Td>{publication.title}<div className="text-xs text-muted-foreground">{publication.journal}, {publication.publicationYear} · {publication.researchArea}</div></Td>
                  <Td>{publication.authors.join(", ")}</Td>
                  <Td>{publication.doi}</Td>
                  <Td>{publication.verificationScore}%</Td>
                  <Td><Badge className={statusClass(publication.verificationStatus)}>{publication.verificationStatus.replace("_", " ")}</Badge></Td>
                  <Td><div className="flex gap-2"><Button className="h-8 px-2"><Check className="h-4 w-4" /></Button><Button className="h-8 bg-white px-2 text-primary ring-1 ring-border"><X className="h-4 w-4" /></Button></div></Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <p className="mt-3 text-xs text-muted-foreground">Indexed academic staff: {users.filter((user) => user.role === "ACADEMIC_STAFF").length}. Import logs and failed retrieval logs are captured through audit events.</p>
        </CardContent>
      </Card>
    </div>
  );
}
