import Link from "next/link";
import { FileUp, SearchCheck, Settings2 } from "lucide-react";
import { BulkImportForm, OpenAlexSyncButton, VerificationButtons } from "@/components/ict-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Td, Th, Table } from "@/components/ui/table";
import { listAuditLogs, listPublications, listUsers } from "@/lib/repository";
import { requirePageUser } from "@/lib/session";
import type { Publication } from "@/lib/types";

function statusClass(status: string) {
  if (status === "VERIFIED") return "bg-emerald-100 text-emerald-800";
  if (status === "LIKELY_MATCH") return "bg-amber-100 text-amber-800";
  if (status === "REJECTED") return "bg-red-100 text-red-800";
  return "bg-orange-100 text-orange-800";
}

export default async function IctPage() {
  await requirePageUser(["ICT_PERSONNEL", "SUPER_ADMIN"]);
  const [publications, users, audits] = await Promise.all([listPublications(), listUsers(), listAuditLogs()]);
  const staff = users.filter((user) => user.role === "ACADEMIC_STAFF").sort((a, b) => a.fullName.localeCompare(b.fullName));
  const staffName = new Map(users.map((user) => [user.id, user.fullName]));
  const queue = publications
    .filter((publication) => publication.verificationStatus !== "VERIFIED" && publication.verificationStatus !== "REJECTED")
    .sort((a, b) => a.verificationScore - b.verificationScore);
  const decided = publications.filter((publication) => publication.verifiedBy).slice(0, 10);
  // The same work held by two co-authors is expected; a duplicate is the same work twice for one person.
  const duplicates = publications.length - new Set(publications.map((publication) => `${publication.userId}|${(publication.doi ?? publication.title).toLowerCase()}`)).size;
  const failedImports = audits.filter((audit) => /failed/i.test(audit.action)).length;
  const staffOptions = staff.map((member) => ({ id: member.id, name: member.fullName }));

  const row = (publication: Publication) => (
    <tr key={publication.id}>
      <Td>
        <span className="font-medium">{publication.title}</span>
        <div className="text-xs text-muted-foreground">{publication.journal}, {publication.publicationYear} · {publication.researchArea}</div>
      </Td>
      <Td>
        <Link href={`/dashboard/staff/${publication.userId}`} className="font-semibold text-primary">{staffName.get(publication.userId) ?? "Unknown"}</Link>
        <div className="text-xs text-muted-foreground">{publication.authors.slice(0, 4).join(", ")}</div>
      </Td>
      <Td className="break-all text-xs">{publication.doi}</Td>
      <Td>{publication.verificationScore}%</Td>
      <Td><Badge className={statusClass(publication.verificationStatus)}>{publication.verificationStatus.replace("_", " ")}</Badge></Td>
      <Td><VerificationButtons publicationId={publication.id} status={publication.verificationStatus} /></Td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">ICT Research Management Center</h1>
          <p className="text-sm text-muted-foreground">Publication validation, OpenAlex synchronization, duplicate detection, and bulk import operations.</p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <OpenAlexSyncButton staff={staffOptions} />
          <a href="#bulk-import" className="inline-flex h-10 items-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-primary ring-1 ring-border">
            <FileUp className="h-4 w-4" /> Bulk Upload
          </a>
        </div>
      </section>

      <section className="dashboard-grid">
        <Card><CardHeader><CardTitle>Publication Validation Queue</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{queue.length}</CardContent></Card>
        <Card><CardHeader><CardTitle>Author Verification Queue</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{queue.filter((item) => item.verificationStatus === "MANUAL_REVIEW").length}</CardContent></Card>
        <Card><CardHeader><CardTitle>Duplicate Publications</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{duplicates}</CardContent></Card>
        <Card><CardHeader><CardTitle>Failed Retrieval Logs</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{failedImports}</CardContent></Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><SearchCheck className="h-4 w-4" /> Author Verification Center</CardTitle>
          <p className="text-sm text-muted-foreground">Lowest-confidence matches first. Verified publications count toward SRS; rejected ones are excluded.</p>
        </CardHeader>
        <CardContent>
          <Table className="min-w-[860px]">
            <thead><tr><Th>Publication</Th><Th>Staff / Authors</Th><Th>DOI</Th><Th>Confidence</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
            <tbody>
              {queue.slice(0, 50).map(row)}
              {!queue.length ? <tr><Td colSpan={6} className="text-center text-muted-foreground">The verification queue is empty.</Td></tr> : null}
            </tbody>
          </Table>
          {queue.length > 50 ? <p className="mt-3 text-xs text-muted-foreground">Showing 50 of {queue.length} publications awaiting review.</p> : null}
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileUp className="h-4 w-4" /> Bulk OpenAlex Import</CardTitle>
            <p className="text-sm text-muted-foreground">Paste DOIs or OpenAlex work ids (one per line). Records are fetched from OpenAlex and verified against the staff name.</p>
          </CardHeader>
          <CardContent><BulkImportForm staff={staffOptions} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Settings2 className="h-4 w-4" /> Recent Verification Decisions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {decided.map((publication) => (
              <div key={publication.id} className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="break-words font-medium">{publication.title}</p>
                  <p className="text-xs text-muted-foreground">{staffName.get(publication.userId)} · by {staffName.get(publication.verifiedBy ?? "") ?? "ICT"}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge className={statusClass(publication.verificationStatus)}>{publication.verificationStatus.replace("_", " ")}</Badge>
                  <VerificationButtons publicationId={publication.id} status={publication.verificationStatus} />
                </div>
              </div>
            ))}
            {!decided.length ? <p className="text-sm text-muted-foreground">No manual verification decisions yet.</p> : null}
          </CardContent>
        </Card>
      </section>

      <p className="text-xs text-muted-foreground">Indexed academic staff: {staff.length}. Import activity and failures are recorded in the admin audit log.</p>
    </div>
  );
}
