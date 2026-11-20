import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "student";

export interface SessionInfo {
  userId: string;
  email: string;
  role: AppRole | null;
}

/** Re-validates the user with the auth server and reads their role from user_roles. */
export async function fetchSessionInfo(): Promise<SessionInfo | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id);
  const list = (roles ?? []).map((r) => r.role);
  const role: AppRole | null = list.includes("admin")
    ? "admin"
    : list.includes("student")
      ? "student"
      : null;
  return { userId: data.user.id, email: data.user.email ?? "", role };
}

export function homeFor(role: AppRole | null): "/admin/clubs" | "/clubs" {
  return role === "admin" ? "/admin/clubs" : "/clubs";
}
