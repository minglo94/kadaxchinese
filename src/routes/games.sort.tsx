import { createFileRoute } from "@tanstack/react-router";
import { SentenceSort } from "@/components/games/SentenceSort";

type Search = { id?: string };

export const Route = createFileRoute("/games/sort")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  component: SortRoute,
});

function SortRoute() {
  const { id } = Route.useSearch();
  return <SentenceSort initialId={id} />;
}
