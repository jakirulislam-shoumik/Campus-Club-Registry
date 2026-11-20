import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/registry/EmptyState";
import { PageHeader } from "@/components/registry/PageHeader";
import { StatusStamp } from "@/components/registry/StatusStamp";
import { supabase } from "@/integrations/supabase/client";
import { activeClubsQuery, keys, myMembershipsQuery } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { friendlyError } from "@/lib/rules";

export const Route = createFileRoute("/_authenticated/_student/clubs")({
  head: () => ({ meta: [{ title: "Clubs — Campus Club Registry" }] }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(activeClubsQuery),
      context.queryClient.ensureQueryData(myMembershipsQuery),
    ]),
  component: ClubsPage,
});

function ClubsPage() {
  const { session } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const { data: clubs } = useSuspenseQuery(activeClubsQuery);
  const { data: memberships } = useSuspenseQuery(myMembershipsQuery);
  const byClub = new Map(memberships.map((m) => [m.club_id, m]));

  const request = useMutation({
    mutationFn: async (clubId: string) => {
      const { error } = await supabase
        .from("memberships")
        .insert({ student_id: session.userId, club_id: clubId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Requested to join");
      queryClient.invalidateQueries({ queryKey: keys.myMemberships });
    },
    onError: (e) => toast.error(friendlyError(e)),
  });

  return (
    <>
      <PageHeader
        eyebrow="Register of societies"
        title="Clubs"
        description="Browse active clubs and request to join. An admin reviews every request."
      />
      {clubs.length === 0 ? (
        <EmptyState
          title="No active clubs yet"
          body="Clubs appear here once the registry office activates them. Check back soon."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => {
            const m = byClub.get(club.club_id);
            const pending = request.isPending && request.variables === club.club_id;
            return (
              <article key={club.club_id} className="ledger-card flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="ledger-label">{club.category}</p>
                  {m ? <StatusStamp status={m.status} animate /> : null}
                </div>
                <h2 className="mt-2 text-xl font-semibold leading-tight">{club.club_name}</h2>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{club.description}</p>
                <dl className="mt-4 grid grid-cols-2 gap-2 border-t pt-4 text-xs">
                  <div>
                    <dt className="ledger-label">Established</dt>
                    <dd className="mt-0.5 font-mono">{formatDate(club.established_date)}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="ledger-label">Contact</dt>
                    <dd className="mt-0.5 truncate">
                      <a href={`mailto:${club.email}`} className="inline-flex items-center gap-1 underline-offset-2 hover:underline">
                        <Mail className="h-3 w-3" aria-hidden="true" />
                        {club.email}
                      </a>
                    </dd>
                  </div>
                </dl>
                <div className="mt-4">
                  {m ? (
                    <p className="text-xs text-muted-foreground">
                      {m.status === "Pending" && `Requested ${formatDate(m.join_date)} · awaiting review`}
                      {m.status === "Active" && `Member since ${formatDate(m.join_date)} · ${m.role_in_club}`}
                      {m.status === "Rejected" && "This request was not approved. Contact the club for details."}
                    </p>
                  ) : (
                    <Button
                      variant="brass"
                      className="w-full"
                      disabled={pending}
                      onClick={() => request.mutate(club.club_id)}
                    >
                      {pending ? <Loader2 className="animate-spin" /> : null}
                      Request to join
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
