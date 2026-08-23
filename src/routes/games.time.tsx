import { createFileRoute } from "@tanstack/react-router";
import { TimeAttack } from "@/components/games/TimeAttack";

type Search = { id?: string };

export const Route = createFileRoute("/games/time")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  component: TimeRoute,
});

function TimeRoute() {
  const { id } = Route.useSearch();
  return <TimeAttack initialId={id} />;
}
