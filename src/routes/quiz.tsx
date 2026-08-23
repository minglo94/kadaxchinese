import { createFileRoute } from "@tanstack/react-router";
import { QuizPage } from "@/components/quiz/QuizPage";

type QuizSearch = { id?: string };

export const Route = createFileRoute("/quiz")({
  validateSearch: (search: Record<string, unknown>): QuizSearch => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  component: QuizRoute,
});

function QuizRoute() {
  const { id } = Route.useSearch();
  return <QuizPage initialId={id} />;
}
