import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Clock, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/registry/EmptyState";
import { PageHeader } from "@/components/registry/PageHeader";
import { StatusStamp } from "@/components/registry/StatusStamp";
import { supabase } from "@/integrations/supabase/client";
import { eventsQuery, keys, myMembershipsQuery, myRegistrationsQuery } from "@/lib/data";
import { formatDay, formatTime } from "@/lib/format";
import { canReRegister, friendlyError, isUpcoming, sortByDate, todayISO } from "@/lib/rules";

export const Route = createFileRoute("/_authenticated/_student/events")({
  head: () => ({ meta: [{ title: "Events — Campus Club Registry" }] }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(eventsQuery),
      context.queryClient.ensureQueryData(myMembershipsQuery),
      context.queryClient.ensureQueryData(myRegistrationsQuery),
    ]),
  component: EventsPage,
});

function EventsPage() {
  const { session } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const { data: events } = useSuspenseQuery(eventsQuery);
  const { data: memberships } = useSuspenseQuery(myMembershipsQuery);
  const { data: registrations } = useSuspenseQuery(myRegistrationsQuery);

  const today = todayISO();
  const activeClubIds = new Set(
    memberships.filter((m) => m.status === "Active").map((m) => m.club_id),
  );
  const regByEvent = new Map(registrations.map((r) => [r.event_id, r]));
  const upcoming = sortByDate(
    events.filter((e) => isUpcoming(e.event_date, today) && e.clubs?.status === "Active"),
  );

  const register = useMutation({
    mutationFn: async (eventId: string) => {
      const existing = regByEvent.get(eventId);
      const { error } = existing
        ? await supabase
            .from("event_registrations")
            .update({ status: "Registered" })
            .eq("registration_id", existing.registration_id)
        : await supabase
            .from("event_registrations")
            .insert({ student_id: session.userId, event_id: eventId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Registered");
      queryClient.invalidateQueries({ queryKey: keys.myRegistrations });
    },
    onError: (e) => toast.error(friendlyError(e)),
  });

  return (
    <>
      <PageHeader
        eyebrow="Calendar of meetings"
        title="Events"
        description="Upcoming events from active clubs, soonest first."
      />
      {upcoming.length === 0 ? (
        <EmptyState
          title="No upcoming events"
          body="Nothing is scheduled right now. Join a club to hear about its next meeting."
          action={
            <Button asChild variant="brass">
              <Link to="/clubs">Browse clubs</Link>
            </Button>
          }
        />
      ) : (
        <ol className="space-y-4">
          {upcoming.map((ev) => {
            const d = formatDay(ev.event_date);
            const reg = regByEvent.get(ev.event_id);
            const isMember = activeClubIds.has(ev.club_id);
            const pending = register.isPending && register.variables === ev.event_id;
            const showButton = !reg || canReRegister(reg.status, ev.event_date, true, today);
            return (
              <li key={ev.event_id} className="ledger-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <div className="flex w-16 shrink-0 flex-col items-center rounded-md border bg-secondary py-2 text-center">
                  <span className="ledger-label">{d.month}</span>
                  <span className="font-display text-2xl font-semibold leading-none">{d.day}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{d.weekday}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="ledger-label">{ev.clubs?.club_name}</p>
                    {isMember ? (
                      <span className="rounded-full border border-brass/50 bg-brass-soft px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-foreground">
                        Club member
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-1 text-lg font-semibold">{ev.event_name}</h2>
                  {ev.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{ev.description}</p>
                  ) : null}
                  <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {formatTime(ev.start_time)} – {formatTime(ev.end_time)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      {ev.venue}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
                  {reg && reg.status !== "Cancelled" ? <StatusStamp status={reg.status} animate /> : null}
                  {reg?.status === "Cancelled" ? <StatusStamp status="Cancelled" /> : null}
                  {showButton ? (
                    <Button disabled={pending} onClick={() => register.mutate(ev.event_id)}>
                      {pending ? <Loader2 className="animate-spin" /> : null}
                      {reg ? "Register again" : "Register"}
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
