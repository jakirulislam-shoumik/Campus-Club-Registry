import { Link, type LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";

export interface TabItem {
  to: NonNullable<LinkProps["to"]>;
  label: string;
  badge?: ReactNode | undefined;
}

export function TabNav({ tabs, label }: { tabs: TabItem[]; label: string }) {
  return (
    <nav aria-label={label} className="border-b bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-4 sm:px-6">
        {tabs.map((t) => (
          <Link key={t.to} to={t.to} className="ledger-tab">
            {t.label}
            {t.badge}
          </Link>
        ))}
      </div>
    </nav>
  );
}
