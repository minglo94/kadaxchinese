import { createFileRoute } from "@tanstack/react-router";
import { SnakeGame } from "@/components/games/SnakeGame";

type Search = { id?: string };

export const Route = createFileRoute("/games/snake")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  component: SnakeRoute,
});

function SnakeRoute() {
  const { id } = Route.useSearch();
  return <SnakeGame initialId={id} />;
}
