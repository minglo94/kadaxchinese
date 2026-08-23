import { createFileRoute } from "@tanstack/react-router";
import { DictationPage } from "@/components/dictation/DictationPage";

type DictationSearch = { id?: string };

export const Route = createFileRoute("/dictation")({
  validateSearch: (search: Record<string, unknown>): DictationSearch => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  component: DictationRoute,
});

function DictationRoute() {
  const { id } = Route.useSearch();
  return <DictationPage initialId={id} />;
}
