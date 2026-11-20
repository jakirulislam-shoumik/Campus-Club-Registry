import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, fieldProps } from "./Field";
import { eventSchema, type EventInput } from "@/lib/rules";
import type { EventRow } from "@/lib/data";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function toForm(ev?: EventRow | null) {
  return {
    club_id: ev?.club_id ?? "",
    event_name: ev?.event_name ?? "",
    description: ev?.description ?? "",
    event_date: ev?.event_date ?? "",
    start_time: ev?.start_time?.slice(0, 5) ?? "",
    end_time: ev?.end_time?.slice(0, 5) ?? "",
    venue: ev?.venue ?? "",
  };
}

export function EventFormDialog({
  open,
  onOpenChange,
  event,
  clubs,
  onSubmit,
  submitting,
  serverError,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  event?: EventRow | null | undefined;
  clubs: { club_id: string; club_name: string; status: string }[];
  onSubmit: (values: EventInput) => void;
  submitting: boolean;
  serverError?: string | undefined;
}) {
  const [form, setForm] = useState(toForm(event));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm(toForm(event));
      setErrors({});
    }
  }, [open, event]);

  const set = (k: keyof ReturnType<typeof toForm>) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function handle(e: FormEvent) {
    e.preventDefault();
    const parsed = eventSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const i of parsed.error.issues) next[String(i.path[0])] ??= i.message;
      setErrors(next);
      return;
    }
    setErrors({});
    onSubmit(parsed.data);
  }

  const err = (k: string): string | undefined => errors[k];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{event ? "Edit event" : "New event"}</DialogTitle>
          <DialogDescription>
            {event ? "Update the details students see." : "Schedule an event for one of the clubs."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handle} noValidate className="grid gap-4 sm:grid-cols-2">
          {serverError ? (
            <p role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger sm:col-span-2">
              {serverError}
            </p>
          ) : null}
          <div className="sm:col-span-2">
            <Field id="club_id" label="Club" error={err("club_id")}>
              <select {...fieldProps("club_id", err("club_id"))} value={form.club_id} onChange={set("club_id")} className={selectClass}>
                <option value="">Choose a club…</option>
                {clubs.map((c) => (
                  <option key={c.club_id} value={c.club_id}>
                    {c.club_name}
                    {c.status === "Inactive" ? " (inactive)" : ""}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field id="event_name" label="Event name" error={err("event_name")}>
              <Input {...fieldProps("event_name", err("event_name"))} value={form.event_name} onChange={set("event_name")} />
            </Field>
          </div>
          <Field id="event_date" label="Date" error={err("event_date")}>
            <Input {...fieldProps("event_date", err("event_date"))} type="date" value={form.event_date} onChange={set("event_date")} />
          </Field>
          <Field id="venue" label="Venue" error={err("venue")}>
            <Input {...fieldProps("venue", err("venue"))} value={form.venue} onChange={set("venue")} placeholder="Auditorium B" />
          </Field>
          <Field id="start_time" label="Starts" error={err("start_time")}>
            <Input {...fieldProps("start_time", err("start_time"))} type="time" value={form.start_time} onChange={set("start_time")} />
          </Field>
          <Field id="end_time" label="Ends" error={err("end_time")}>
            <Input {...fieldProps("end_time", err("end_time"))} type="time" value={form.end_time} onChange={set("end_time")} />
          </Field>
          <div className="sm:col-span-2">
            <Field id="event_description" label="Description" error={err("description")}>
              <Textarea {...fieldProps("event_description", err("description"))} rows={3} value={form.description} onChange={set("description")} />
            </Field>
          </div>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : null}
              {event ? "Save changes" : "Create event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
