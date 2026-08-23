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

export type QuizItem = {
  q: string;
  o: string[];
  a: number;
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
