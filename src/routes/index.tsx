import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/registry/TopBar";
import { StatusStamp } from "@/components/registry/StatusStamp";
import { supabase } from "@/integrations/supabase/client";
import { fetchSessionInfo, homeFor, type AppRole } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Campus Club Registry — Join clubs and campus events" },
      {
        name: "description",
        content:
          "The university's register of student clubs: browse societies, request membership and sign up for events.",
      },
      { property: "og:title", content: "Campus Club Registry — Join clubs and campus events" },
      {
        property: "og:description",
        content:
          "The university's register of student clubs: browse societies, request membership and sign up for events.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const SAMPLE = [
  { no: "014", name: "Photography Society", cat: "Arts", status: "Active", rot: "-rotate-2" },
  { no: "027", name: "Competitive Programming Club", cat: "Technology", status: "Pending", rot: "rotate-1" },
  { no: "031", name: "Debate Union", cat: "Academic", status: "Registered", rot: "-rotate-1" },
];

function Index() {
  const [role, setRole] = useState<AppRole | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        if (!cancelled) setRole(undefined);
        return;
      }
      const info = await fetchSessionInfo();
      if (!cancelled) setRole(info ? info.role : undefined);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const signedIn = role !== undefined;

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto grid max-w-6xl gap-14 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-center lg:py-24">
        <section>
          <p className="ledger-label">Office of Student Affairs · Est. register</p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.05] sm:text-6xl">
            Every campus club, <em className="text-brass">entered</em> in one register.
          </h1>
          <div className="brass-rule mt-8 w-40" />
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Browse active societies, request to join, and save your seat at their next meeting.
            Your memberships and sign-ups are kept on file in one place.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            {signedIn ? (
              <Button asChild size="lg" variant="brass">
                <Link to={homeFor(role ?? null)}>
                  Open the register <ArrowRight />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" variant="brass">
                  <Link to="/register">
                    Register as a student <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/login">Sign in</Link>
                </Button>
              </>
            )}
          </div>
          <dl className="mt-14 grid max-w-lg grid-cols-3 gap-6 border-t pt-6">
            {[
              ["01", "Browse clubs"],
              ["02", "Request to join"],
              ["03", "Register for events"],
            ].map(([n, label]) => (
              <div key={n}>
                <dt className="font-mono text-xs text-brass">{n}</dt>
                <dd className="mt-1 text-sm font-medium">{label}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-label="Sample register entries" className="relative mx-auto w-full max-w-md">
          <div className="space-y-5">
            {SAMPLE.map((s) => (
              <div key={s.no} className={`ledger-card ${s.rot} p-5 shadow-[var(--shadow-raised)]`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="ledger-label">
                      Entry No. {s.no} · {s.cat}
                    </p>
                    <p className="mt-1 font-display text-xl font-semibold">{s.name}</p>
                  </div>
                  <StatusStamp status={s.status} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-dashed pt-3">
                  <span className="h-1.5 rounded-full bg-muted" />
                  <span className="h-1.5 rounded-full bg-muted" />
                  <span className="h-1.5 w-2/3 rounded-full bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
