import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { TopBar } from "@/components/registry/TopBar";
import { fetchSessionInfo } from "@/lib/auth";

// The session lives in browser storage, so this gate runs client-side only.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const session = await fetchSessionInfo();
    if (!session) throw redirect({ to: "/login" });
    return { session };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { session } = Route.useRouteContext();
  return (
    <div className="min-h-screen">
      <TopBar email={session.email} role={session.role} />
      <Outlet />
    </div>
  );
}
