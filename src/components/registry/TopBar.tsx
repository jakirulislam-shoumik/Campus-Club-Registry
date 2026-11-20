import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Seal } from "./Seal";
import type { AppRole } from "@/lib/auth";

export function TopBar({ email, role }: { email?: string | undefined; role?: AppRole | null | undefined }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <header className="topbar">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3 rounded-sm">
          <Seal />
          <span className="leading-tight">
            <span className="block font-display text-lg font-semibold">Campus Club Registry</span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-topbar-muted sm:block">
              Office of Student Affairs
            </span>
          </span>
        </Link>
        {email ? (
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden text-right md:block">
              <p className="text-sm">{email}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brass">
                {role === "admin" ? "Administrator" : "Student"}
              </p>
            </div>
            <Button variant="topbar" size="sm" onClick={handleSignOut}>
              <LogOut />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
