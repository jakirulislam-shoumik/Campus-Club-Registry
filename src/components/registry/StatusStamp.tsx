import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  Active: "stamp-success",
  Pending: "stamp-warning",
  Rejected: "stamp-danger",
  Registered: "stamp-ink",
  Cancelled: "stamp-danger",
  Attended: "stamp-brass",
  Inactive: "stamp-muted",
  Member: "stamp-ink",
  Executive: "stamp-brass",
};

export function StatusStamp({
  status,
  className,
  animate = false,
}: {
  status: string;
  className?: string | undefined;
  animate?: boolean;
}) {
  return (
    <span className={cn("stamp", TONE[status] ?? "stamp-muted", animate && "stamp-in", className)}>
      {status}
    </span>
  );
}
