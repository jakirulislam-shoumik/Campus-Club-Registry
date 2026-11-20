import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/registry/EmptyState";
import { PageHeader } from "@/components/registry/PageHeader";
import { StatusStamp } from "@/components/registry/StatusStamp";
import { supabase } from "@/integrations/supabase/client";
import { adminMembershipsQuery } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { friendlyError, sortPendingFirst } from "@/lib/rules";

export const Route = createFileRoute("/_authenticated/admin/requests")({
  head: () => ({ meta: [{ title: "Membership requests — Campus Club Registry" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(adminMembershipsQuery),
  component: RequestsPage,
});

type Change =
  | { id: string; status: "Active" | "Rejected" }
  | { id: string; role: "Member" | "Executive" };

function RequestsPage() {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(adminMembershipsQuery);
  const rows = sortPendingFirst(data);
  const pendingCount = data.filter((m) => m.status === "Pending").length;

  const update = useMutation({
    mutationFn: async (c: Change) => {
      const patch = "status" in c ? { status: c.status } : { role_in_club: c.role };
      const { error } = await supabase.from("memberships").update(patch).eq("membership_id", c.id);
      if (error) throw error;
      return c;
    },
    onSuccess: (c) => {
      if ("status" in c) toast.success(c.status === "Active" ? "Approved" : "Rejected");
      else toast.success(c.role === "Executive" ? "Made Executive" : "Made Member");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e) => toast.error(friendlyError(e)),
  });

  const busy = (id: string) => update.isPending && update.variables?.id === id;

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Membership Requests"
        description={
          pendingCount > 0
            ? `${pendingCount} request${pendingCount === 1 ? "" : "s"} waiting for review. Pending requests are listed first.`
            : "All caught up — no requests are waiting."
        }
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No membership requests yet"
          body="When students ask to join a club, their requests appear here for approval."
        />
      ) : (
        <div className="ledger-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ledger-label">Student</TableHead>
                <TableHead className="ledger-label">Club</TableHead>
                <TableHead className="ledger-label">Requested</TableHead>
                <TableHead className="ledger-label">Status</TableHead>
                <TableHead className="ledger-label text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((m) => (
                <TableRow key={m.membership_id} className={m.status === "Pending" ? "bg-warning-soft/40" : undefined}>
                  <TableCell>
                    <p className="font-medium">{m.students?.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.students?.email}
                      {m.students?.department ? ` · ${m.students.department}` : ""}
                    </p>
                  </TableCell>
                  <TableCell>{m.clubs?.club_name ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs">{formatDate(m.join_date)}</TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusStamp status={m.status} />
                      {m.status === "Active" && m.role_in_club === "Executive" ? (
                        <StatusStamp status="Executive" />
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {m.status === "Pending" ? (
                        <>
                          <Button size="sm" variant="success" disabled={busy(m.membership_id)} onClick={() => update.mutate({ id: m.membership_id, status: "Active" })}>
                            <Check /> Approve
                          </Button>
                          <Button size="sm" variant="outline-danger" disabled={busy(m.membership_id)} onClick={() => update.mutate({ id: m.membership_id, status: "Rejected" })}>
                            <X /> Reject
                          </Button>
                        </>
                      ) : m.status === "Active" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy(m.membership_id)}
                          onClick={() =>
                            update.mutate({
                              id: m.membership_id,
                              role: m.role_in_club === "Executive" ? "Member" : "Executive",
                            })
                          }
                        >
                          {m.role_in_club === "Executive" ? "Make Member" : "Make Executive"}
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled={busy(m.membership_id)} onClick={() => update.mutate({ id: m.membership_id, status: "Active" })}>
                          Approve
                        </Button>
                      )}
                    </div>
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
