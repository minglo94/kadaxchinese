import { articles, getArticle } from "@/data/articles";
import type { Article, QuizItem } from "@/data/types";
import type { ChatMessage } from "@/lib/gemini";

export const AI_TOKENS = {
  ping: 32,
  tutor: 1600,
  explain: 900,
  grade: 800,
  quiz: 2800,
} as const;

const TITLES = articles.map((item) => item.title).join("、");

const STYLE_RULES = [
  "只用繁體中文（香港用語）作答。",
  "不要英文、不要 emoji、不要 markdown（不要 *、**、#、```）。",
  "不要輸出 Drafting、Thinking、Conclusion、結論： 這類草稿標籤。",
  "分段清楚：用「1. 2. 3.」或獨立短句，讓中四至中六學生一看就明。",
].join("\n");

function fullText(article: Article): string {
  return article.p.map((para) => para.t).join("\n");
}

function vocabLine(article: Article): string {
  return article.v.map((item) => `${item.w}＝${item.m}`).join("；");
}

export function articleContext(articleId?: string): string {
  const article = articleId ? getArticle(articleId) : undefined;
  if (!article) {
    return [
      `指定範文目錄：${TITLES}`,
      "學生可能問任何一篇的句子或手法。若對方貼出文言原句，立刻語譯並解釋，不要反問「請提供句子」。",
    ].join("\n");
  }
  return [
    `學生正在讀：${article.title}（${article.author}）`,
    `核心論點：${article.c.join("；")}`,
    `必考詞：${vocabLine(article)}`,
    `全文：`,
    fullText(article),
  ].join("\n");
}

function articleByTitle(title: string): Article | undefined {
  return articles.find((item) => item.title === title || title.includes(item.title.replace(/[《》]/g, "")));
}

export function tutorMessages(
  articleId: string | undefined,
  history: Array<{ role: "user" | "assistant"; content: string }>,
): ChatMessage[] {
  const clipped = history.slice(-8).map((item) => ({
    role: item.role,
    content: item.content.slice(0, 1600),
  }));
  return [
    {
      role: "system",
      content: [
        "你是「範文十二式」書齋助教，專責香港文憑試中文科十二篇指定範文。",
        STYLE_RULES,
        "學生若貼出文言句子，即使沒標篇名，也要立刻處理，禁止反問「請提供句子」。",
        "語譯必須完整，至少包含：",
        "1. 完整白話語譯（整句譯完，不可只譯一半）",
        "2. 關鍵實詞／虛詞解釋（逐詞說明）",
        "3. 句意與在該篇中的用意",
        "4. 若屬指定範文，註明篇名與作者",
        "問主旨、手法、論證時，先答重點，再分點舉原文為證。",
        "解釋要具體、詳盡，寧可多寫兩三句，也不要含糊收束。",
        articleContext(articleId),
      ].join("\n"),
    },
    ...clipped,
  ];
}

export function explainMessages(input: {
  articleTitle: string;
  question: string;
  options: string[];
  correctIndex: number;
  pickedIndex: number;
}): ChatMessage[] {
  const article = articleByTitle(input.articleTitle);
  const correct = input.options[input.correctIndex] ?? "";
  const picked = input.options[input.pickedIndex] ?? "";
  const wrong = input.pickedIndex !== input.correctIndex;
  return [
    {
      role: "system",
      content: [
        "你是香港文憑試中文科助教，只講十二篇指定範文。",
        STYLE_RULES,
        "解析要讓學生真正明白考點，不可只說「正確」或「錯誤」就完。",
      ].join("\n"),
    },
    {
      role: "user",
      content: [
        `篇章：${input.articleTitle}`,
        article ? `論點：${article.c.join("；")}` : "",
        article ? `必考詞：${vocabLine(article)}` : "",
        article ? `原文：${fullText(article).slice(0, 1200)}` : "",
        `題目：${input.question}`,
        `選項：${input.options.map((opt, i) => `${i + 1}. ${opt}`).join("／")}`,
        `學生選了：${picked}`,
        `正確答案：${correct}`,
        wrong
          ? [
              "請按以下結構作答（約 180–280 字）：",
              "1. 判定：學生選錯，正確是哪一項",
              "2. 正確選項為何對：結合原文詞義或句意，引用短句為證",
              "3. 學生選項為何錯：指出誤解了哪個詞或哪層意思",
              "4. 易混提醒：一個常見陷阱",
            ].join("\n")
          : [
              "學生答對了。請按以下結構鞏固（約 160–240 字）：",
              "1. 判定：答對，並重述正確意思",
              "2. 原文依據：這個詞／句在文中怎麼用",
              "3. 易混點：同學最常把哪個意思搞錯",
              "4. 一句記憶提示",
            ].join("\n"),
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];
}

export function gradeMessages(input: {
  articleTitle: string;
  sentence: string;
  expected: string[];
  given: string[];
}): ChatMessage[] {
  const article = articleByTitle(input.articleTitle);
  return [
    {
      role: "system",
      content: [
        "你是文憑試中文默書助教。",
        STYLE_RULES,
        "允許通假字、異體字的彈性，但關鍵實詞寫錯仍要指出。",
        "評語必須具體：哪個字錯、正確寫法、該詞在句中意思，不可只丟幾個字。",
      ].join("\n"),
    },
    {
      role: "user",
      content: [
        `篇章：${input.articleTitle}`,
        article ? `必考詞：${vocabLine(article)}` : "",
        `原句：${input.sentence}`,
        `應填：${input.expected.join("、")}`,
        `學生：${input.given.map((item) => item || "（空白）").join("、")}`,
        "請用以下格式回覆：",
        "判定：全對／語意對用字有誤／錯誤",
        "正確寫法：把應填的字詞完整寫出",
        "評語：",
        "1. 逐一對照學生所寫與正確字詞",
        "2. 錯字要解釋正確寫法與意思",
        "3. 補一句這句在文中的意思，方便記住",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];
}

export function generateQuizMessages(articleId: string): ChatMessage[] | { error: string } {
  const article = getArticle(articleId);
  if (!article) return { error: "找不到這篇範文。" };
  return [
    {
      role: "system",
      content: [
        "你是 DSE 中文科出題老師。只根據提供的指定範文出題。",
        "只輸出 JSON 陣列，不要 markdown、不要解說、不要英文。",
      ].join("\n"),
    },
    {
      role: "user",
      content: [
        `篇章：${article.title}／${article.author}`,
        `論點：${article.c.join("；")}`,
        `詞解：${vocabLine(article)}`,
        `原文：${fullText(article)}`,
        "請出 6 題四選一選擇題，覆蓋：詞義、句意、寫作手法、主旨。難度接近 HKDSE。",
        "每題題幹要完整清楚，選項要有合理干擾項。",
        '只輸出：[{"q":"題幹","o":["選項一","選項二","選項三","選項四"],"a":0}]',
        "a 是正確選項的 0-based 索引。題幹與選項用繁體中文。",
      ].join("\n"),
    },
  ];
}

function coerceAnswer(value: unknown, optionCount: number): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.min(optionCount - 1, Math.round(value)));
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    const letter = trimmed.match(/^[A-Da-d]/);
    if (letter) return letter[0].toUpperCase().charCodeAt(0) - 65;
    const num = Number.parseInt(trimmed, 10);
    if (Number.isFinite(num)) {
      if (num >= 1 && num <= optionCount) return num - 1;
      if (num >= 0 && num < optionCount) return num;
    }
  }
  return null;
}

function asQuestion(row: unknown): QuizItem | null {
  if (!row || typeof row !== "object") return null;
  const item = row as Record<string, unknown>;
  const q = item.q ?? item.question ?? item.題幹;
  const rawOptions = item.o ?? item.options ?? item.choices ?? item.選項;
  const a = item.a ?? item.answer ?? item.correct ?? item.正確;
  if (typeof q !== "string") return null;
  let options: string[] = [];
  if (Array.isArray(rawOptions)) {
    options = rawOptions.filter((opt): opt is string => typeof opt === "string").slice(0, 4);
  } else if (rawOptions && typeof rawOptions === "object") {
    options = ["A", "B", "C", "D"]
      .map((key) => (rawOptions as Record<string, unknown>)[key])
      .filter((opt): opt is string => typeof opt === "string");
  }
  if (options.length < 4) return null;
  const answer = coerceAnswer(a, 4);
  if (answer === null) return null;
  return { q: q.trim(), o: options, a: answer };
}

export function parseGeneratedQuiz(
  text: string,
): { ok: true; questions: QuizItem[] } | { ok: false; error: string } {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  let raw = fenced ? fenced[1] : text;
  raw = raw.replace(/^[^{\[]+/, "");
  const arrayStart = raw.indexOf("[");
  const objectStart = raw.indexOf("{");
  let slice = "";
  if (arrayStart >= 0 && (objectStart < 0 || arrayStart <= objectStart)) {
    const end = raw.lastIndexOf("]");
    if (end > arrayStart) slice = raw.slice(arrayStart, end + 1);
  } else if (objectStart >= 0) {
    const end = raw.lastIndexOf("}");
    if (end > objectStart) slice = raw.slice(objectStart, end + 1);
  }
  if (!slice) return { ok: false, error: "AI 回傳格式不正確，請再試一次。" };

  const repaired = slice.replace(/,\s*([\]}])/g, "$1");
  try {
    const parsed = JSON.parse(repaired) as unknown;
    const rows = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && Array.isArray((parsed as { questions?: unknown }).questions)
        ? (parsed as { questions: unknown[] }).questions
        : [parsed];
    const questions = rows.map(asQuestion).filter((item): item is QuizItem => Boolean(item)).slice(0, 6);
    if (questions.length < 4) return { ok: false, error: "AI 出題數量不足，請再試一次。" };
    return { ok: true, questions };
  } catch {
    return { ok: false, error: "無法解析 AI 出題結果，請再試一次。" };
  }
}
