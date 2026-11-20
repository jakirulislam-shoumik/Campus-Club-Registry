import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Seal } from "./Seal";
import { StatusStamp } from "./StatusStamp";

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="topbar relative hidden flex-col justify-between overflow-hidden border-b-0 border-r-[3px] border-r-brass p-10 lg:flex">
        <Link to="/" className="flex items-center gap-3 rounded-sm">
          <Seal />
          <span className="font-display text-lg font-semibold">Campus Club Registry</span>
        </Link>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-brass">
            Register · Folio 01
          </p>
          <p className="mt-4 max-w-sm font-display text-3xl leading-snug">
            Every society, every meeting, every member — entered in one ledger.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <StatusStamp status="Active" />
            <StatusStamp status="Pending" />
            <StatusStamp status="Registered" />
            <StatusStamp status="Attended" />
          </div>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-topbar-muted">
          Office of Student Affairs
        </p>
      </aside>

      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-lg">
          <Link to="/" className="mb-8 flex items-center gap-3 rounded-sm lg:hidden">
            <Seal className="bg-topbar" />
            <span className="font-display text-lg font-semibold">Campus Club Registry</span>
          </Link>
          <p className="ledger-label">{eyebrow}</p>
          <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="ledger-card mt-8 p-6 sm:p-8">{children}</div>
          <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
        </div>
      </main>
    </div>
  );
}
