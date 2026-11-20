import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/registry/EmptyState";
import { EventFormDialog } from "@/components/registry/EventFormDialog";
import { PageHeader } from "@/components/registry/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { adminClubsQuery, adminEventsQuery, type EventRow } from "@/lib/data";
import { formatDate, formatTime } from "@/lib/format";
import { friendlyError, isUpcoming, type EventInput } from "@/lib/rules";

export const Route = createFileRoute("/_authenticated/admin/events")({
  head: () => ({ meta: [{ title: "Manage events — Campus Club Registry" }] }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(adminEventsQuery),
      context.queryClient.ensureQueryData(adminClubsQuery),
    ]),
  component: AdminEventsPage,
});

function AdminEventsPage() {
  const { session } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const { data: events } = useSuspenseQuery(adminEventsQuery);
  const { data: clubs } = useSuspenseQuery(adminClubsQuery);
  const [editing, setEditing] = useState<EventRow | null>(null);
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string>();

  const save = useMutation({
    mutationFn: async (values: EventInput) => {
      const { error } = editing
        ? await supabase.from("events").update(values).eq("event_id", editing.event_id)
        : await supabase.from("events").insert({ ...values, created_by: session.userId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(editing ? "Changes saved" : "Event created");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (e) => setServerError(friendlyError(e)),
  });

  function openForm(ev: EventRow | null) {
    setEditing(ev);
    setServerError(undefined);
    setOpen(true);
  }

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Events"
        description="Schedule events for each club and see how many students have signed up."
        actions={
          <Button variant="brass" onClick={() => openForm(null)} disabled={clubs.length === 0}>
            <Plus /> New event
          </Button>
        }
      />
      {events.length === 0 ? (
        <EmptyState
          title="No events scheduled"
          body={clubs.length === 0 ? "Create a club first, then schedule its first event." : "Schedule the first event so students can register."}
          action={
            clubs.length > 0 ? (
              <Button variant="brass" onClick={() => openForm(null)}>
                <Plus /> New event
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="ledger-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ledger-label">Date</TableHead>
                <TableHead className="ledger-label">Event</TableHead>
                <TableHead className="ledger-label">Venue</TableHead>
                <TableHead className="ledger-label text-right">Registrations</TableHead>
                <TableHead className="ledger-label text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((ev) => {
                const count = ev.event_registrations.filter((r) => r.status !== "Cancelled").length;
                const past = !isUpcoming(ev.event_date);
                return (
                  <TableRow key={ev.event_id} className={past ? "text-muted-foreground" : undefined}>
                    <TableCell className="whitespace-nowrap font-mono text-xs">
                      {formatDate(ev.event_date)}
                      <br />
                      {formatTime(ev.start_time)}–{formatTime(ev.end_time)}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-foreground">{ev.event_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ev.clubs?.club_name}
                        {past ? " · past" : ""}
                      </p>
                    </TableCell>
                    <TableCell>{ev.venue}</TableCell>
                    <TableCell className="text-right font-display text-xl font-semibold text-foreground">{count}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openForm(ev)}>
                        <Pencil /> Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <EventFormDialog
        open={open}
        onOpenChange={setOpen}
        event={editing}
        clubs={clubs}
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
