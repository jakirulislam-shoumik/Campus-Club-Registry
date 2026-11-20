import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { TabNav } from "@/components/registry/TabNav";

export const Route = createFileRoute("/_authenticated/_student")({
  beforeLoad: ({ context }) => {
    if (context.session.role === "admin") throw redirect({ to: "/admin/clubs" });
  },
  component: StudentLayout,
});

function StudentLayout() {
  return (
    <>
      <TabNav
        label="Student sections"
        tabs={[
          { to: "/clubs", label: "Clubs" },
          { to: "/memberships", label: "My Memberships" },
          { to: "/events", label: "Events" },
          { to: "/registrations", label: "My Registrations" },
        ]}
      />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Outlet />
      </main>
    </>
  );
}
