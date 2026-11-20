import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/components/registry/AuthShell";
import { Field, fieldProps } from "@/components/registry/Field";
import { supabase } from "@/integrations/supabase/client";
import { fetchSessionInfo, homeFor } from "@/lib/auth";
import { friendlyError, loginSchema } from "@/lib/rules";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Campus Club Registry" },
      { name: "description", content: "Sign in to request club memberships and register for campus events." },
      { property: "og:title", content: "Sign in — Campus Club Registry" },
      { property: "og:description", content: "Sign in to request club memberships and register for campus events." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session || cancelled) return;
      const info = await fetchSessionInfo();
      if (info && !cancelled) navigate({ to: homeFor(info.role), replace: true });
    });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) {
      setSubmitting(false);
      setErrors({ form: friendlyError(error) });
      return;
    }
    const info = await fetchSessionInfo();
    setSubmitting(false);
    toast.success("Signed in");
    navigate({ to: homeFor(info?.role ?? null), replace: true });
  }

  return (
    <AuthShell
      eyebrow="Members' entrance"
      title="Sign in"
      subtitle="Use the email and password you registered with."
      footer={
        <>
          New to the registry?{" "}
          <Link to="/register" className="font-medium text-foreground underline underline-offset-4">
            Register as a student
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {errors["form"] ? (
          <p role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
            {errors["form"]}
          </p>
        ) : null}
        <Field id="email" label="Email" error={errors["email"]}>
          <Input
            {...fieldProps("email", errors["email"])}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@campus.edu"
          />
        </Field>
        <Field id="password" label="Password" error={errors["password"]}>
          <Input
            {...fieldProps("password", errors["password"])}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? <Loader2 className="animate-spin" /> : null}
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
