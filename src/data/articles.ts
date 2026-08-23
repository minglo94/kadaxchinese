import raw from "./articles.json";
import type { Article } from "./types";

export type { Article, Paragraph, Vocab, FlashCard, QuizItem, DictationItem } from "./types";

export const articles = raw as Article[];

export const categories = ["全部", "諸子散文", "歷史與傳記", "詩詞曲"] as const;

export function getArticle(id: string): Article | undefined {
  return articles.find((item) => item.id === id);
}
