import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/registry/EmptyState";
import { PageHeader } from "@/components/registry/PageHeader";
import { StatusStamp } from "@/components/registry/StatusStamp";
import { supabase } from "@/integrations/supabase/client";
import { adminRegistrationsQuery } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { friendlyError } from "@/lib/rules";

export const Route = createFileRoute("/_authenticated/admin/registrations")({
  head: () => ({ meta: [{ title: "Event registrations — Campus Club Registry" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(adminRegistrationsQuery),
  component: AdminRegistrationsPage,
});

function AdminRegistrationsPage() {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(adminRegistrationsQuery);
  const [eventId, setEventId] = useState("all");

  const eventOptions = Array.from(
    new Map(
      data
        .filter((r) => r.events)
        .map((r) => [r.event_id, { id: r.event_id, name: r.events!.event_name, date: r.events!.event_date }]),
    ).values(),
  ).sort((a, b) => b.date.localeCompare(a.date));

  const rows = eventId === "all" ? data : data.filter((r) => r.event_id === eventId);

  const mark = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("event_registrations")
        .update({ status: "Attended" })
        .eq("registration_id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Marked Attended");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e) => toast.error(friendlyError(e)),
  });

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Event Registrations"
        description="Every sign-up across all events. Mark students as attended so they can leave feedback."
        actions={
          <div className="w-full min-w-56 space-y-1 sm:w-auto">
            <Label htmlFor="event-filter" className="ledger-label">
              Filter by event
            </Label>
            <select
              id="event-filter"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All events</option>
              {eventOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} · {formatDate(o.date)}
                </option>
              ))}
            </select>
          </div>
        }
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No registrations yet"
          body="Once students register for events, they'll be listed here. Make sure events are scheduled for active clubs."
        />
      ) : (
        <div className="ledger-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ledger-label">Student</TableHead>
                <TableHead className="ledger-label">Event</TableHead>
                <TableHead className="ledger-label">Status</TableHead>
                <TableHead className="ledger-label">Feedback</TableHead>
                <TableHead className="ledger-label text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.registration_id}>
                  <TableCell>
                    <p className="font-medium">{r.students?.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{r.students?.email}</p>
                  </TableCell>
                  <TableCell>
                    <p>{r.events?.event_name ?? "—"}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {formatDate(r.events?.event_date)} · {r.events?.clubs?.club_name}
                    </p>
                  </TableCell>
                  <TableCell className="py-4">
                    <StatusStamp status={r.status} />
                  </TableCell>
                  <TableCell className="max-w-xs text-sm text-muted-foreground">
                    {r.feedback ? <span className="line-clamp-2">“{r.feedback}”</span> : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {r.status === "Registered" ? (
                      <Button
                        size="sm"
                        variant="success"
                        disabled={mark.isPending && mark.variables === r.registration_id}
                        onClick={() => mark.mutate(r.registration_id)}
                      >
                        <CheckCheck /> Mark Attended
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
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
