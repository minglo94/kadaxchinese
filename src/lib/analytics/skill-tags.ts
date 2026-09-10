import type { Article, QuizItem, SkillTag } from "@/data/types";

/**
 * 決定一道題目測的是哪一種能力。
 *
 * `item.skill` 優先（`src/data/articles.json` 的人手標註）；未標註時用關鍵字
 * 推導，這樣 `generateQuiz` 產生的題目也有維度，而人手標註可以分批補上而不
 * 需要改任何程式碼。
 */

const RHETORIC = /修辭|手法|比喻|借代|對比|排比|反問|設問|襯托|象徵|誇張|對偶|層遞/;
const VOCAB =
  /詞義|意思|解作|何解|所指|意指|字義|語譯|「[^」]{1,4}」(?:字|詞)?(?:的)?(?:意思|意義|解)/;
const THEME = /主旨|中心|論點|情感|感情|心情|態度|寓意|旨在|抒發|表達了|說明了甚麼道理|啟示/;
const CONTEXT = /作者|年代|朝代|出處|背景|體裁|文體|選自|何人|誰/;

export function skillOf(item: QuizItem, article?: Article): SkillTag {
  if (item.skill) return item.skill;
  const text = item.q;
  if (RHETORIC.test(text)) return "rhetoric";
  if (THEME.test(text)) return "theme";
  if (VOCAB.test(text)) return "vocab";
  if (CONTEXT.test(text)) return "content";
  // 選項全部落在這篇的詞彙釋義裡 → 幾乎一定是考字詞。
  if (article && item.o.length > 0) {
    const meanings = new Set(article.v.map((v) => v.m.replace(/。$/, "")));
    const hits = item.o.filter((option) => meanings.has(option.replace(/。$/, ""))).length;
    if (hits >= Math.max(2, item.o.length - 1)) return "vocab";
  }
  return "content";
}

/** 每篇文章逐題的能力標籤，index 對應 `article.q` 的位置。 */
export function skillsForArticle(article: Article): SkillTag[] {
  return article.q.map((item) => skillOf(item, article));
}
