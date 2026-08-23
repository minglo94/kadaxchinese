import { createFileRoute, Link } from "@tanstack/react-router";
import { ReadingPage } from "@/components/reading/ReadingPage";
import { getArticle } from "@/data/articles";

export const Route = createFileRoute("/read/$id")({
  component: ReadRoute,
});

function ReadRoute() {
  const { id } = Route.useParams();
  const article = getArticle(id);
  if (!article) {
    return (
      <div className="py-20 text-center">
        <p className="font-serif text-xl">找不到這篇範文。</p>
        <Link to="/" className="mt-4 inline-block text-accent">
          返回總覽
        </Link>
      </div>
    );
  }
  return <ReadingPage article={article} />;
}
