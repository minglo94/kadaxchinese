import { createFileRoute } from "@tanstack/react-router";
import { MemoryMatch } from "@/components/games/MemoryMatch";

type Search = { id?: string };

export const Route = createFileRoute("/games/match")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  component: MatchRoute,
});

function MatchRoute() {
  const { id } = Route.useSearch();
  return <MemoryMatch initialId={id} />;
}
