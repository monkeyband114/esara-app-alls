"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Td, Th, Table } from "@/components/ui/table";

type Row = {
  id: string;
  name: string;
  department: string;
  faculty: string;
  rank: number;
  srs: number;
  citations: number;
  hIndex: number;
  publications: number;
  trendScore: number;
};

export function LeaderboardTable({ rows }: { rows: Row[] }) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("All");
  const [sort, setSort] = useState<keyof Row>("rank");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const departments = ["All", ...Array.from(new Set(rows.map((row) => row.department)))];
  const filtered = useMemo(() => {
    return rows
      .filter((row) => department === "All" || row.department === department)
      .filter((row) => [row.name, row.department, row.faculty].join(" ").toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => {
        if (sort === "rank") return a.rank - b.rank;
        const left = a[sort];
        const right = b[sort];
        return typeof left === "number" && typeof right === "number" ? right - left : String(left).localeCompare(String(right));
      });
  }, [department, query, rows, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative w-full sm:w-auto sm:min-w-64 sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search leaderboard" aria-label="Search leaderboard" className="pl-9" />
        </div>
        <select aria-label="Department" className="h-10 min-w-0 flex-1 rounded-md border bg-white px-3 text-sm sm:flex-none" value={department} onChange={(event) => { setDepartment(event.target.value); setPage(1); }}>
          {departments.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select aria-label="Sort by" className="h-10 min-w-0 flex-1 rounded-md border bg-white px-3 text-sm sm:flex-none" value={sort} onChange={(event) => setSort(event.target.value as keyof Row)}>
          <option value="rank">Rank</option>
          <option value="srs">SRS</option>
          <option value="citations">Citations</option>
          <option value="hIndex">h-index</option>
          <option value="publications">Publications</option>
          <option value="trendScore">Growth</option>
        </select>
      </div>
      <Table>
        <thead><tr><Th>Rank</Th><Th>Researcher</Th><Th>Department</Th><Th>SRS</Th><Th>Citations</Th><Th>h-index</Th><Th>Publications</Th><Th></Th></tr></thead>
        <tbody>
          {current.map((row) => (
            <tr key={row.id}>
              <Td>#{row.rank}</Td>
              <Td><div className="font-semibold">{row.name}</div><div className="text-xs text-muted-foreground">{row.faculty}</div></Td>
              <Td>{row.department}</Td>
              <Td>{row.srs.toFixed(1)}</Td>
              <Td>{row.citations}</Td>
              <Td>{row.hIndex}</Td>
              <Td>{row.publications}</Td>
              <Td><Link className="font-semibold text-primary" href={`/dashboard/staff/${row.id}`}>Profile</Link></Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Page {page} of {pages}</span>
        <div className="flex gap-2">
          <Button className="h-8 bg-white px-2 text-primary ring-1 ring-border" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <Button className="h-8 bg-white px-2 text-primary ring-1 ring-border" disabled={page === pages} onClick={() => setPage((value) => Math.min(pages, value + 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}
