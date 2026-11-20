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
import { clubSchema, type ClubInput } from "@/lib/rules";
import type { Club } from "@/lib/data";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function toForm(club?: Club | null) {
  return {
    club_name: club?.club_name ?? "",
    category: club?.category ?? "",
    email: club?.email ?? "",
    description: club?.description ?? "",
    established_date: club?.established_date ?? "",
    status: (club?.status ?? "Active") as "Active" | "Inactive",
  };
}

export function ClubFormDialog({
  open,
  onOpenChange,
  club,
  onSubmit,
  submitting,
  serverError,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  club?: Club | null | undefined;
  onSubmit: (values: ClubInput) => void;
  submitting: boolean;
  serverError?: string | undefined;
}) {
  const [form, setForm] = useState(toForm(club));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm(toForm(club));
      setErrors({});
    }
  }, [open, club]);

  const set = (k: keyof ReturnType<typeof toForm>) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function handle(e: FormEvent) {
    e.preventDefault();
    const parsed = clubSchema.safeParse(form);
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
          <DialogTitle className="font-display text-2xl">{club ? "Edit club" : "New club"}</DialogTitle>
          <DialogDescription>
            {club ? "Update this club's entry in the register." : "Add a club to the register."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handle} noValidate className="grid gap-4 sm:grid-cols-2">
          {serverError ? (
            <p role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger sm:col-span-2">
              {serverError}
            </p>
          ) : null}
          <div className="sm:col-span-2">
            <Field id="club_name" label="Club name" error={err("club_name")}>
              <Input {...fieldProps("club_name", err("club_name"))} value={form.club_name} onChange={set("club_name")} />
            </Field>
          </div>
          <Field id="category" label="Category" error={err("category")}>
            <Input {...fieldProps("category", err("category"))} value={form.category} onChange={set("category")} placeholder="Arts" />
          </Field>
          <Field id="status" label="Status" error={err("status")}>
            <select {...fieldProps("status", err("status"))} value={form.status} onChange={set("status")} className={selectClass}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </Field>
          <Field id="club_email" label="Contact email" error={err("email")}>
            <Input {...fieldProps("club_email", err("email"))} type="email" value={form.email} onChange={set("email")} placeholder="club@campus.edu" />
          </Field>
          <Field id="established_date" label="Established" error={err("established_date")}>
            <Input {...fieldProps("established_date", err("established_date"))} type="date" value={form.established_date} onChange={set("established_date")} />
          </Field>
          <div className="sm:col-span-2">
            <Field id="description" label="Description" error={err("description")}>
              <Textarea {...fieldProps("description", err("description"))} rows={4} value={form.description} onChange={set("description")} />
            </Field>
          </div>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : null}
              {club ? "Save changes" : "Create club"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

