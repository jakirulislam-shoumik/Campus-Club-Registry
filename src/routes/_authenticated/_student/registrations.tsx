import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/registry/EmptyState";
import { PageHeader } from "@/components/registry/PageHeader";
import { StatusStamp } from "@/components/registry/StatusStamp";
import { supabase } from "@/integrations/supabase/client";
import { keys, myRegistrationsQuery } from "@/lib/data";
import { formatDate, formatTime } from "@/lib/format";
import { canCancelRegistration, canGiveFeedback, feedbackSchema, friendlyError, todayISO } from "@/lib/rules";

export const Route = createFileRoute("/_authenticated/_student/registrations")({
  head: () => ({ meta: [{ title: "My Registrations — Campus Club Registry" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(myRegistrationsQuery),
  component: RegistrationsPage,
});

function RegistrationsPage() {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(myRegistrationsQuery);
  const today = todayISO();

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("event_registrations")
        .update({ status: "Cancelled" })
        .eq("registration_id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cancelled");
      queryClient.invalidateQueries({ queryKey: keys.myRegistrations });
    },
    onError: (e) => toast.error(friendlyError(e)),
  });

  return (
    <>
      <PageHeader
        eyebrow="Your sign-ups"
        title="My Registrations"
        description="Cancel a spot before the event, or leave feedback once you've been marked as attended."
      />
      {data.length === 0 ? (
        <EmptyState
          title="No registrations yet"
          body="Find an upcoming event and register to save your spot."
          action={
            <Button asChild variant="brass">
              <Link to="/events">See upcoming events</Link>
            </Button>
          }
        />
      ) : (
        <div className="ledger-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ledger-label">Event</TableHead>
                <TableHead className="ledger-label">When</TableHead>
                <TableHead className="ledger-label">Status</TableHead>
                <TableHead className="ledger-label text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r) => {
                const ev = r.events;
                const cancellable = ev ? canCancelRegistration(r.status, ev.event_date, today) : false;
                return (
                  <Fragment key={r.registration_id}>
                    <TableRow className={canGiveFeedback(r.status) ? "border-b-0" : undefined}>
                      <TableCell>
                        <p className="font-medium">{ev?.event_name ?? "Event removed"}</p>
                        <p className="text-xs text-muted-foreground">
                          {ev?.clubs?.club_name ?? "—"} · {ev?.venue}
                        </p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-xs">
                        {formatDate(ev?.event_date)}
                        <br />
                        {formatTime(ev?.start_time)}
                      </TableCell>
                      <TableCell className="py-4">
                        <StatusStamp status={r.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {cancellable ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline-danger" size="sm">
                                Cancel
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel your spot?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  You'll be removed from {ev?.event_name}. You can register again
                                  from the Events page while it's still upcoming.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Keep my spot</AlertDialogCancel>
                                <AlertDialogAction onClick={() => cancel.mutate(r.registration_id)}>
                                  Cancel
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                    {canGiveFeedback(r.status) ? (
                      <TableRow>
                        <TableCell colSpan={4} className="bg-brass-soft/40 pt-0">
                          <FeedbackForm id={r.registration_id} initial={r.feedback ?? ""} />
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}

function FeedbackForm({ id, initial }: { id: string; initial: string }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string>();
  const fieldId = `feedback-${id}`;

  const save = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await supabase
        .from("event_registrations")
        .update({ feedback: text })
        .eq("registration_id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Feedback saved");
      queryClient.invalidateQueries({ queryKey: keys.myRegistrations });
    },
    onError: (e) => toast.error(friendlyError(e)),
  });

  return (
    <form
      className="flex flex-col gap-2 pt-3 sm:flex-row sm:items-start"
      onSubmit={(e) => {
        e.preventDefault();
        const parsed = feedbackSchema.safeParse(value);
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message);
          return;
        }
        setError(undefined);
        save.mutate(parsed.data);
      }}
    >
      <div className="flex-1">
        <label htmlFor={fieldId} className="ledger-label">
          Your feedback
        </label>
        <Textarea
          id={fieldId}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={2}
          className="mt-1 bg-card"
          placeholder="What did you enjoy? What could be better?"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : undefined}
        />
        {error ? (
          <p id={`${fieldId}-error`} role="alert" className="mt-1 text-xs font-medium text-danger">
            {error}
          </p>
        ) : null}
      </div>
      <Button type="submit" size="sm" className="sm:mt-6" disabled={save.isPending}>
        {save.isPending ? <Loader2 className="animate-spin" /> : null}
        Save feedback
      </Button>
    </form>
  );
}
