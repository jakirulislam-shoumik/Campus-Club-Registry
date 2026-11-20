import { cn } from "@/lib/utils";

export function Seal({ className }: { className?: string | undefined }) {
  return (
    <span aria-hidden="true" className={cn("seal h-9 w-9 text-sm", className)}>
      CR
    </span>
  );
}
