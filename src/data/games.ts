import { articles, getArticle } from "@/data/articles";
import type { Article, QuizItem } from "@/data/types";

export type VocabChallenge = {
  articleId: string;
  title: string;
  word: string;
  meaning: string;
  distractors: string[];
  quote: string;
};

export type SortPuzzle = {
  id: string;
  articleId: string;
  title: string;
  chunks: string[];
  hint: string;
};

export type BlankPuzzle = {
  id: string;
  articleId: string;
  title: string;
  text: string;
  hint: string;
};

export function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function pickArticle(articleId?: string): Article[] {
  if (articleId && articleId !== "all") {
    const found = getArticle(articleId);
    return found ? [found] : articles;
  }
  return articles;
}

function quoteFor(article: Article, word: string): string {
  const hit = article.p.find((para) => para.t.includes(word));
  if (!hit) return article.p[0]?.t ?? "";
  const clipped = hit.t.replace(/\n/g, "");
  return clipped.length > 42 ? `${clipped.slice(0, 42)}…` : clipped;
}

export function getVocabChallenges(articleId?: string): VocabChallenge[] {
  const pool = pickArticle(articleId);
  const allMeanings = articles.flatMap((item) => item.v.map((v) => v.m));
  const list: VocabChallenge[] = [];
  for (const article of pool) {
    for (const vocab of article.v) {
      const distractors = shuffle(
        allMeanings.filter((meaning) => meaning !== vocab.m),
      ).slice(0, 2);
      if (distractors.length < 2) continue;
      list.push({
        articleId: article.id,
        title: article.title,
        word: vocab.w,
        meaning: vocab.m.replace(/。$/, ""),
        distractors: distractors.map((item) => item.replace(/。$/, "")),
        quote: quoteFor(article, vocab.w),
      });
    }
  }
  return shuffle(list);
}

export function getQuizPool(articleId?: string): Array<QuizItem & { articleId: string; title: string }> {
  return shuffle(
    pickArticle(articleId).flatMap((article) =>
      article.q.map((item) => ({ ...item, articleId: article.id, title: article.title })),
    ),
  );
}

export function getFlashPairs(articleId?: string): Array<{ front: string; back: string; articleId: string; title: string }> {
  return shuffle(
    pickArticle(articleId).flatMap((article) =>
      article.v.map((item) => ({
        front: item.w,
        back: item.m.replace(/。$/, ""),
        articleId: article.id,
        title: article.title,
      })),
    ),
  );
}

const FEATURED_SORTS: Array<Omit<SortPuzzle, "title">> = [
  {
    id: "mengzi-yuxiong",
    articleId: "meng-zi",
    chunks: [
      "魚，我所欲也；熊掌，亦我所欲也。",
      "二者不可得兼，舍魚而取熊掌者也。",
      "生，亦我所欲也；義，亦我所欲也。",
      "二者不可得兼，舍生而取義者也。",
    ],
    hint: "以魚與熊掌比喻生與義，帶出「舍生取義」。",
  },
  {
    id: "xunzi-xue",
    articleId: "xun-zi",
    chunks: [
      "君子曰：學不可以已。",
      "青，取之於藍，而青於藍；",
      "冰，水為之，而寒於水。",
      "故木受繩則直，金就礪則利。",
    ],
    hint: "以青出於藍、金就礪則利，論證學習能改變本性。",
  },
  {
    id: "xunzi-qi",
    articleId: "xun-zi",
    chunks: [
      "故不積蹞步，無以至千里；",
      "不積小流，無以成江海。",
      "騏驥一躍，不能十步；",
      "駑馬十駕，功在不舍。",
      "鍥而舍之，朽木不折；鍥而不舍，金石可鏤。",
    ],
    hint: "積累與堅持：騏驥不如駑馬十駕，功在不舍。",
  },
  {
    id: "hanyu-shi",
    articleId: "han-yu",
    chunks: [
      "古之學者必有師。",
      "師者，所以傳道、受業、解惑也。",
      "人非生而知之者，孰能無惑？",
      "是故無貴無賤，無長無少，道之所存，師之所存也。",
    ],
    hint: "擇師的唯一標準是「道」，無分貴賤長少。",
  },
  {
    id: "hanyu-zhuan",
    articleId: "han-yu",
    chunks: [
      "是故弟子不必不如師，",
      "師不必賢於弟子，",
      "聞道有先後，",
      "術業有專攻，如是而已。",
    ],
    hint: "師生關係是相對的，聞道有先後。",
  },
  {
    id: "zhuge-xian",
    articleId: "zhu-ge-liang",
    chunks: [
      "親賢臣，遠小人，此先漢所以興隆也；",
      "親小人，遠賢臣，此後漢所以傾頹也。",
      "先帝在時，每與臣論此事，未嘗不歎息痛恨於桓、靈也。",
    ],
    hint: "出師表以先漢／後漢對比，勸後主親賢遠佞。",
  },
  {
    id: "zhuge-buyi",
    articleId: "zhu-ge-liang",
    chunks: [
      "臣本布衣，躬耕於南陽，",
      "苟全性命於亂世，不求聞達於諸侯。",
      "先帝不以臣卑鄙，猥自枉屈，三顧臣於草廬之中，",
      "諮臣以當世之事，由是感激，遂許先帝以驅馳。",
      "後值傾覆，受任於敗軍之際，奉命於危難之間。",
    ],
    hint: "自述三顧草廬與臨危受命，表明報先帝之忠。",
  },
  {
    id: "fan-ren",
    articleId: "fan-zhong-yan",
    chunks: [
      "不以物喜，不以己悲；",
      "居廟堂之高則憂其民；",
      "處江湖之遠則憂其君。",
      "是進亦憂，退亦憂。",
      "先天下之憂而憂，後天下之樂而樂。",
    ],
    hint: "古仁人的境界：先憂後樂，不以物喜不以己悲。",
  },
  {
    id: "fan-rain",
    articleId: "fan-zhong-yan",
    chunks: [
      "若夫霪雨霏霏，連月不開，",
      "陰風怒號，濁浪排空；",
      "登斯樓也，則有去國懷鄉，憂讒畏譏，",
      "滿目蕭然，感極而悲者矣。",
    ],
    hint: "遷客騷人因陰景而生悲，是「以物悲」。",
  },
  {
    id: "suxun-open",
    articleId: "su-xun",
    chunks: [
      "六國破滅，非兵不利，戰不善，弊在賂秦。",
      "賂秦而力虧，破滅之道也。",
      "或曰：六國互喪，率賂秦耶？",
      "曰：不賂者以賂者喪。",
    ],
    hint: "中心論點：六國破滅，弊在賂秦。",
  },
  {
    id: "zhuang-peng",
    articleId: "zhuang-zi",
    chunks: [
      "北冥有魚，其名為鯤。",
      "鯤之大，不知其幾千里也。",
      "化而為鳥，其名為鵬。",
      "鵬之背，不知其幾千里也；",
      "怒而飛，其翼若垂天之雲。",
    ],
    hint: "以鯤鵬變化開篇，寫「逍遙」需積厚。",
  },
  {
    id: "liuzongyuan",
    articleId: "liu-zong-yuan",
    chunks: [
      "自余為僇人，居是州，恆惴慄。",
      "其隙也，則施施而行，漫漫而遊。",
      "日與其徒上高山，入深林，窮回溪，",
      "幽泉怪石，無遠不到。",
    ],
    hint: "謫居永州，先寫惴慄，再寫漫遊排遣。",
  },
];

function splitSentences(text: string): string[] {
  return text
    .replace(/\n/g, "")
    .split(/(?<=[。！？])/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 4);
}

function autoSortPuzzles(article: Article): SortPuzzle[] {
  const puzzles: SortPuzzle[] = [];
  article.p.forEach((para, index) => {
    let chunks = splitSentences(para.t);
    const expanded: string[] = [];
    for (const chunk of chunks) {
      if (chunk.length > 30 && chunk.includes("；")) {
        const bits = chunk.split("；").map((bit, i, arr) => (i < arr.length - 1 ? `${bit}；` : bit));
        expanded.push(...bits.filter((bit) => bit.length >= 4));
      } else {
        expanded.push(chunk);
      }
    }
    chunks = expanded;
    const push = (slice: string[], key: string) => {
      if (slice.length < 3 || slice.length > 6) return;
      if (slice.some((item) => item.length > 48)) return;
      puzzles.push({
        id: `${article.id}-auto-${key}`,
        articleId: article.id,
        title: article.title,
        chunks: slice,
        hint: para.h || article.c[0] || "請按原文順序排列。",
      });
    };
    if (chunks.length >= 3 && chunks.length <= 6) {
      push(chunks, String(index));
    } else if (chunks.length > 6) {
      push(chunks.slice(0, 5), `${index}-a`);
    }
  });
  return puzzles.slice(0, 3);
}

export function getSortPuzzles(articleId?: string): SortPuzzle[] {
  const pool = pickArticle(articleId);
  const featured = FEATURED_SORTS.filter((item) => pool.some((article) => article.id === item.articleId)).map(
    (item) => ({
      ...item,
      title: getArticle(item.articleId)?.title ?? item.articleId,
    }),
  );
  const auto = pool.flatMap(autoSortPuzzles);
  const seen = new Set<string>();
  const merged: SortPuzzle[] = [];
  for (const puzzle of [...featured, ...auto]) {
    const key = puzzle.chunks.join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(puzzle);
  }
  return shuffle(merged);
}

export function getBlankPuzzles(articleId?: string): BlankPuzzle[] {
  const pool = pickArticle(articleId);
  return shuffle(
    pool.flatMap((article) =>
      article.dictation.map((item, index) => {
        const naked = item.text.replace(/[{}]/g, "");
        const para = article.p.find((row) => row.t.includes(naked.slice(0, 8)) || naked.includes(row.t.slice(0, 8)));
        return {
          id: `${article.id}-blank-${index}`,
          articleId: article.id,
          title: article.title,
          text: item.text,
          hint: para?.h || article.c[0] || "根據語譯與課文記憶填空。",
        };
      }),
    ),
  );
}

export function parseBlanks(text: string) {
  const parts: Array<{ type: "text"; value: string } | { type: "blank"; answer: string; index: number }> = [];
  const re = /\{([^}]+)\}/g;
  let last = 0;
  let blankIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    if (match.index > last) parts.push({ type: "text", value: text.slice(last, match.index) });
    parts.push({ type: "blank", answer: match[1], index: blankIndex });
    blankIndex += 1;
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  return parts;
}

export const GAME_META = [
  {
    id: "snake" as const,
    to: "/games/snake",
    title: "詞解貪食蛇",
    kicker: "直覺反應",
    blurb: "地圖上同時出現對錯解釋，操控墨蛇吃掉正確詞義。吃對加長，吃錯扣心。",
  },
  {
    id: "time" as const,
    to: "/games/time",
    title: "限時生存戰",
    kicker: "瘋狂刷題",
    blurb: "六十秒倒數。答對加三秒、答錯扣五秒，連擊越高分數越兇。",
  },
  {
    id: "match" as const,
    to: "/games/match",
    title: "字義翻牌",
    kicker: "配對記憶",
    blurb: "文言詞與白話語譯各一組牌，翻出正確配對才能消去。",
  },
  {
    id: "sort" as const,
    to: "/games/sort",
    title: "課文重組",
    kicker: "脈絡默書",
    blurb: "把《出師表》《岳陽樓記》等長段打散，拖曳回原文順序。",
  },
  {
    id: "hangman" as const,
    to: "/games/hangman",
    title: "名句填字謎",
    kicker: "三命解謎",
    blurb: "給出語譯提示與課文空格，只有三次猜錯機會，血條會下降。",
  },
] as const;

export type GameId = (typeof GAME_META)[number]["id"];
