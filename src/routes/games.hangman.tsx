import { createFileRoute } from "@tanstack/react-router";
import { HangmanGame } from "@/components/games/HangmanGame";

type Search = { id?: string };

export const Route = createFileRoute("/games/hangman")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  component: HangmanRoute,
});

function HangmanRoute() {
  const { id } = Route.useSearch();
  return <HangmanGame initialId={id} />;
}
