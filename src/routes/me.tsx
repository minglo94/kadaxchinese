import { createFileRoute } from "@tanstack/react-router";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";

type MeSearch = { joined?: number };

export const Route = createFileRoute("/me")({
  validateSearch: (search: Record<string, unknown>): MeSearch => ({
    joined: search.joined === 1 || search.joined === "1" ? 1 : undefined,
  }),
  component: MeRoute,
});

function MeRoute() {
  const { joined } = Route.useSearch();
  return <StudentDashboard joined={joined === 1} />;
}
