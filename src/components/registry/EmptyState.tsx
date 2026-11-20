import type { ReactNode } from "react";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode | undefined;
}) {
  return (
    <div className="ledger-card flex flex-col items-center px-6 py-14 text-center">
      <span className="ledger-label">Nothing on file</span>
      <h3 className="mt-3 text-xl font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
