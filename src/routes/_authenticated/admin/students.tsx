import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/registry/EmptyState";
import { PageHeader } from "@/components/registry/PageHeader";
import { adminStudentsQuery } from "@/lib/data";
import { formatDate, shortId } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/students")({
  head: () => ({ meta: [{ title: "Students — Campus Club Registry" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(adminStudentsQuery),
  component: StudentsPage,
});

function StudentsPage() {
  const { data } = useSuspenseQuery(adminStudentsQuery);
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const rows = term
    ? data.filter((s) =>
        [s.name, s.email, s.department ?? "", s.phone ?? ""].some((v) => v.toLowerCase().includes(term)),
      )
    : data;

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Students"
        description={`${data.length} registered student${data.length === 1 ? "" : "s"}.`}
        actions={
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              aria-label="Search students"
              placeholder="Search name, email, department…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="bg-card pl-9"
            />
          </div>
        }
      />
      {data.length === 0 ? (
        <EmptyState
          title="No students registered yet"
          body="Share the registration page with students. New sign-ups appear here once they confirm their email."
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title={`No students match “${q}”`}
          body="Try a shorter search, or search by email or department instead."
        />
      ) : (
        <div className="ledger-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ledger-label">Student</TableHead>
                <TableHead className="ledger-label">Phone</TableHead>
                <TableHead className="ledger-label">Department</TableHead>
                <TableHead className="ledger-label">Semester</TableHead>
                <TableHead className="ledger-label">Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.student_id}>
                  <TableCell>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.email}</p>
                    <p className="ledger-id">{shortId(s.student_id)}</p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{s.phone ?? "—"}</TableCell>
                  <TableCell>{s.department ?? "—"}</TableCell>
                  <TableCell className="font-mono">{s.semester ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs">{formatDate(s.registration_date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
