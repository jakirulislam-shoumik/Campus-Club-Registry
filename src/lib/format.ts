import { format, parseISO } from "date-fns";

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return format(parseISO(iso), "d MMM yyyy");
}

export function formatDay(iso: string): { day: string; month: string; weekday: string } {
  const d = parseISO(iso);
  return { day: format(d, "dd"), month: format(d, "MMM"), weekday: format(d, "EEE") };
}

export function formatTime(t: string | null | undefined): string {
  if (!t) return "—";
  const [h = "0", m = "00"] = t.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${m} ${suffix}`;
}

export function shortId(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`;
}
