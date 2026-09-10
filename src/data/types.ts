export type Paragraph = {
  t: string;
  h?: string;
};

export type Vocab = {
  w: string;
  m: string;
};

export type FlashCard = {
  f: string;
  b: string;
};

/**
 * 能力維度標籤。標在題目上，讓能力分析知道答錯的是哪一種能力。
 * Optional：未標註的題目由 `src/lib/analytics/skill-tags.ts` 以關鍵字推導，
 * 所以標註可以分批補上，AI 生成的題目也照樣有維度。
 */
export type SkillTag = "content" | "vocab" | "rhetoric" | "theme";

export type QuizItem = {
  q: string;
  o: string[];
  a: number;
  skill?: SkillTag;
};

export type DictationItem = {
  text: string;
};

export type Article = {
  id: string;
  title: string;
  author: string;
  cat: string;
  p: Paragraph[];
  c: string[];
  v: Vocab[];
  f: FlashCard[];
  q: QuizItem[];
  dictation: DictationItem[];
};

export type ArticleProgress = {
  quizScore: number;
  quizTotal: number;
  dictScore: number;
  dictTotal: number;
  score: number;
  total: number;
  percent: number;
};
