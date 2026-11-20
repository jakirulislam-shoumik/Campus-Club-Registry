import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TabNav } from "@/components/registry/TabNav";
import { pendingCountQuery } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: ({ context }) => {
    if (context.session.role !== "admin") throw redirect({ to: "/clubs" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { data: pending = 0 } = useQuery(pendingCountQuery);
  return (
    <>
      <TabNav
        label="Admin sections"
        tabs={[
          { to: "/admin/clubs", label: "Clubs" },
          {
            to: "/admin/requests",
            label: "Membership Requests",
            badge:
              pending > 0 ? (
                <span className="count-pill" aria-label={`${pending} pending`}>
                  {pending}
                </span>
              ) : undefined,
          },
          { to: "/admin/events", label: "Events" },
          { to: "/admin/registrations", label: "Event Registrations" },
          { to: "/admin/students", label: "Students" },
        ]}
      />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Outlet />
      </main>
    </>
  );
}
