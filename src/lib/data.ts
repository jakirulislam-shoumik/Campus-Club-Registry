import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Club = Tables<"clubs">;
export type Membership = Tables<"memberships">;
export type EventRow = Tables<"events">;
export type Registration = Tables<"event_registrations">;
export type Student = Tables<"students">;

async function unwrap<T>(p: PromiseLike<{ data: T | null; error: unknown }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw error;
  return data as T;
}

export const keys = {
  activeClubs: ["clubs", "active"] as const,
  myMemberships: ["memberships", "mine"] as const,
  events: ["events", "all"] as const,
  myRegistrations: ["registrations", "mine"] as const,
  adminClubs: ["admin", "clubs"] as const,
  adminMemberships: ["admin", "memberships"] as const,
  adminEvents: ["admin", "events"] as const,
  adminRegistrations: ["admin", "registrations"] as const,
  adminStudents: ["admin", "students"] as const,
  pendingCount: ["admin", "pending-count"] as const,
};

// ---------- Student ----------

export const activeClubsQuery = queryOptions({
  queryKey: keys.activeClubs,
  queryFn: () =>
    unwrap(supabase.from("clubs").select("*").eq("status", "Active").order("club_name")),
});

export const myMembershipsQuery = queryOptions({
  queryKey: keys.myMemberships,
  queryFn: () =>
    unwrap(
      supabase
        .from("memberships")
        .select("*, clubs(club_name, category, status)")
        .order("join_date", { ascending: false }),
    ),
});

export const eventsQuery = queryOptions({
  queryKey: keys.events,
  queryFn: () =>
    unwrap(
      supabase
        .from("events")
        .select("*, clubs(club_name, status)")
        .order("event_date")
        .order("start_time"),
    ),
});

export const myRegistrationsQuery = queryOptions({
  queryKey: keys.myRegistrations,
  queryFn: () =>
    unwrap(
      supabase
        .from("event_registrations")
        .select("*, events(event_name, event_date, start_time, end_time, venue, clubs(club_name, status))")
        .order("registration_date", { ascending: false }),
    ),
});

// ---------- Admin ----------

export const adminClubsQuery = queryOptions({
  queryKey: keys.adminClubs,
  queryFn: () =>
    unwrap(supabase.from("clubs").select("*, memberships(status)").order("club_name")),
});

export const adminMembershipsQuery = queryOptions({
  queryKey: keys.adminMemberships,
  queryFn: () =>
    unwrap(
      supabase
        .from("memberships")
        .select("*, students(name, email, department, semester), clubs(club_name)")
        .order("join_date", { ascending: false }),
    ),
});

export const adminEventsQuery = queryOptions({
  queryKey: keys.adminEvents,
  queryFn: () =>
    unwrap(
      supabase
        .from("events")
        .select("*, clubs(club_name, status), event_registrations(status)")
        .order("event_date", { ascending: false }),
    ),
});

export const adminRegistrationsQuery = queryOptions({
  queryKey: keys.adminRegistrations,
  queryFn: () =>
    unwrap(
      supabase
        .from("event_registrations")
        .select("*, students(name, email), events(event_id, event_name, event_date, clubs(club_name))")
        .order("registration_date", { ascending: false }),
    ),
});

export const adminStudentsQuery = queryOptions({
  queryKey: keys.adminStudents,
  queryFn: () => unwrap(supabase.from("students").select("*").order("name")),
});

export const pendingCountQuery = queryOptions({
  queryKey: keys.pendingCount,
  queryFn: async () => {
    const { count, error } = await supabase
      .from("memberships")
      .select("membership_id", { count: "exact", head: true })
      .eq("status", "Pending");
    if (error) throw error;
    return count ?? 0;
  },
});
