import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/registry/EmptyState";
import { PageHeader } from "@/components/registry/PageHeader";
import { StatusStamp } from "@/components/registry/StatusStamp";
import { myMembershipsQuery } from "@/lib/data";
import { formatDate, shortId } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/_student/memberships")({
  head: () => ({ meta: [{ title: "My Memberships — Campus Club Registry" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(myMembershipsQuery),
  component: MembershipsPage,
});

function MembershipsPage() {
  const { data } = useSuspenseQuery(myMembershipsQuery);
  return (
    <>
      <PageHeader
        eyebrow="Your entries"
        title="My Memberships"
        description="Every club you've asked to join and where each request stands."
      />
      {data.length === 0 ? (
        <EmptyState
          title="No memberships yet"
          body="Browse clubs to request one. Your requests and their status will be listed here."
          action={
            <Button asChild variant="brass">
              <Link to="/clubs">Browse clubs</Link>
            </Button>
          }
        />
      ) : (
        <div className="ledger-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ledger-label">Club</TableHead>
                <TableHead className="ledger-label">Join date</TableHead>
                <TableHead className="ledger-label">Role</TableHead>
                <TableHead className="ledger-label text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((m) => (
                <TableRow key={m.membership_id}>
                  <TableCell>
                    <p className="font-medium">{m.clubs?.club_name ?? "Club no longer listed"}</p>
                    <p className="ledger-id">{shortId(m.membership_id)}</p>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{formatDate(m.join_date)}</TableCell>
                  <TableCell>{m.role_in_club}</TableCell>
                  <TableCell className="py-4 text-right">
                    <StatusStamp status={m.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
