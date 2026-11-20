import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClubFormDialog } from "@/components/registry/ClubFormDialog";
import { EmptyState } from "@/components/registry/EmptyState";
import { PageHeader } from "@/components/registry/PageHeader";
import { StatusStamp } from "@/components/registry/StatusStamp";
import { supabase } from "@/integrations/supabase/client";
import { adminClubsQuery, type Club } from "@/lib/data";
import { formatDate, shortId } from "@/lib/format";
import { friendlyError, type ClubInput } from "@/lib/rules";

export const Route = createFileRoute("/_authenticated/admin/clubs")({
  head: () => ({ meta: [{ title: "Manage clubs — Campus Club Registry" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(adminClubsQuery),
  component: AdminClubsPage,
});

function AdminClubsPage() {
  const { session } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const { data: clubs } = useSuspenseQuery(adminClubsQuery);
  const [editing, setEditing] = useState<Club | null>(null);
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string>();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin"] });

  const save = useMutation({
    mutationFn: async (values: ClubInput) => {
      const { error } = editing
        ? await supabase.from("clubs").update(values).eq("club_id", editing.club_id)
        : await supabase.from("clubs").insert({ ...values, created_by: session.userId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(editing ? "Changes saved" : "Club created");
      setOpen(false);
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
    },
    onError: (e) => setServerError(friendlyError(e)),
  });

  const toggle = useMutation({
    mutationFn: async (club: Club) => {
      const status = club.status === "Active" ? "Inactive" : "Active";
      const { error } = await supabase.from("clubs").update({ status }).eq("club_id", club.club_id);
      if (error) throw error;
      return status;
    },
    onSuccess: (status) => {
      toast.success(status === "Active" ? "Activated" : "Deactivated");
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
    },
    onError: (e) => toast.error(friendlyError(e)),
  });

  function openForm(club: Club | null) {
    setEditing(club);
    setServerError(undefined);
    setOpen(true);
  }

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Clubs"
        description="Create clubs, update their details and switch them on or off for students."
        actions={
          <Button variant="brass" onClick={() => openForm(null)}>
            <Plus /> New club
          </Button>
        }
      />
      {clubs.length === 0 ? (
        <EmptyState
          title="No clubs in the register"
          body="Create the first club so students can request to join."
          action={
            <Button variant="brass" onClick={() => openForm(null)}>
              <Plus /> New club
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {clubs.map((club) => {
            const activeMembers = club.memberships.filter((m) => m.status === "Active").length;
            const pending = club.memberships.filter((m) => m.status === "Pending").length;
            return (
              <article key={club.club_id} className="ledger-card flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="ledger-label">
                      {club.category} · <span className="normal-case">{shortId(club.club_id)}</span>
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">{club.club_name}</h2>
                  </div>
                  <StatusStamp status={club.status} />
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{club.description}</p>
                <dl className="mt-4 grid grid-cols-3 gap-3 border-t pt-4">
                  <div>
                    <dt className="ledger-label">Active members</dt>
                    <dd className="mt-0.5 font-display text-2xl font-semibold">{activeMembers}</dd>
                  </div>
                  <div>
                    <dt className="ledger-label">Pending</dt>
                    <dd className="mt-0.5 font-display text-2xl font-semibold">{pending}</dd>
                  </div>
                  <div>
                    <dt className="ledger-label">Established</dt>
                    <dd className="mt-1.5 font-mono text-xs">{formatDate(club.established_date)}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => openForm(club)}>
                    <Pencil /> Edit
                  </Button>
                  <Button
                    variant={club.status === "Active" ? "outline-danger" : "success"}
                    size="sm"
                    disabled={toggle.isPending && toggle.variables?.club_id === club.club_id}
                    onClick={() => toggle.mutate(club)}
                  >
                    <Power /> {club.status === "Active" ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <ClubFormDialog
        open={open}
        onOpenChange={setOpen}
        club={editing}
        onSubmit={(v) => {
          setServerError(undefined);
          save.mutate(v);
        }}
        submitting={save.isPending}
        serverError={serverError}
      />
    </>
  );
}
