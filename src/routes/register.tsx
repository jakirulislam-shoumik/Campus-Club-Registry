import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/components/registry/AuthShell";
import { Field, fieldProps } from "@/components/registry/Field";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError, registerSchema } from "@/lib/rules";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Student registration — Campus Club Registry" },
      { name: "description", content: "Create your student account to join campus clubs and register for events." },
      { property: "og:title", content: "Student registration — Campus Club Registry" },
      { property: "og:description", content: "Create your student account to join campus clubs and register for events." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RegisterPage,
});

const EMPTY = { name: "", email: "", phone: "", department: "", semester: "", password: "" };
type FormState = typeof EMPTY;

function RegisterPage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const set = (k: keyof FormState) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const { password, email, ...profile } = parsed.data;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: { ...profile, semester: String(profile.semester) },
      },
    });
    setSubmitting(false);
    if (error) {
      setErrors({ form: friendlyError(error) });
      return;
    }
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setErrors({ form: "An account with this email already exists. Sign in instead." });
      return;
    }
    toast.success("Registered");
    setSentTo(email);
  }

  if (sentTo) {
    return (
      <AuthShell
        eyebrow="Registration received"
        title="Check your email"
        subtitle="One more step before your entry is added to the register."
        footer={
          <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
            Go to sign in
          </Link>
        }
      >
        <div className="flex flex-col items-center py-4 text-center">
          <MailCheck className="h-10 w-10 text-brass" aria-hidden="true" />
          <p className="mt-4 text-sm">
            We sent a confirmation link to <strong>{sentTo}</strong>. Open it to activate your
            account, then sign in.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Can't find it? Check your spam folder.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="New entry"
      title="Student registration"
      subtitle="Fill in your details to join clubs and sign up for events."
      footer={
        <>
          Already registered?{" "}
          <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
        {errors["form"] ? (
          <p role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger sm:col-span-2">
            {errors["form"]}
          </p>
        ) : null}
        <div className="sm:col-span-2">
          <Field id="name" label="Full name" error={errors["name"]}>
            <Input {...fieldProps("name", errors["name"])} autoComplete="name" value={form.name} onChange={set("name")} placeholder="Ayesha Rahman" />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field id="email" label="Email" error={errors["email"]}>
            <Input {...fieldProps("email", errors["email"])} type="email" autoComplete="email" value={form.email} onChange={set("email")} placeholder="you@campus.edu" />
          </Field>
        </div>
        <Field id="phone" label="Phone" error={errors["phone"]}>
          <Input {...fieldProps("phone", errors["phone"])} type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} placeholder="+880 1712-345678" />
        </Field>
        <Field id="semester" label="Semester" error={errors["semester"]}>
          <select
            {...fieldProps("semester", errors["semester"])}
            value={form.semester}
            onChange={set("semester")}
            className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Choose…</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                Semester {n}
              </option>
            ))}
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field id="department" label="Department" error={errors["department"]}>
            <Input {...fieldProps("department", errors["department"])} value={form.department} onChange={set("department")} placeholder="Computer Science & Engineering" />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field id="password" label="Password" error={errors["password"]} hint="At least 8 characters, with a letter and a number.">
            <Input {...fieldProps("password", errors["password"])} type="password" autoComplete="new-password" value={form.password} onChange={set("password")} />
          </Field>
        </div>
        <Button type="submit" size="lg" className="sm:col-span-2" disabled={submitting}>
          {submitting ? <Loader2 className="animate-spin" /> : null}
          Register
        </Button>
      </form>
    </AuthShell>
  );
}
