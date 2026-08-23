import { Award, CheckCircle2, RotateCcw, Sparkles, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { QuizExplain } from "@/components/ai/AiExplain";
import { Button } from "@/components/ui/button";
import { articles, getArticle } from "@/data/articles";
import type { QuizItem } from "@/data/types";
import { askGenerateQuiz } from "@/lib/ask-ai";
import { clearAnswers, recordQuizAnswer } from "@/lib/progress";
import { cn } from "@/lib/utils";

const AI_CACHE = "dse_ai_quiz_v1";

function readAiCache(id: string): QuizItem[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AI_CACHE);
    if (!raw) return null;
    const all = JSON.parse(raw) as Record<string, QuizItem[]>;
    return all[id] ?? null;
  } catch {
    return null;
  }
}

function writeAiCache(id: string, questions: QuizItem[]) {
  try {
    const raw = localStorage.getItem(AI_CACHE);
    const all = raw ? (JSON.parse(raw) as Record<string, QuizItem[]>) : {};
    all[id] = questions;
    localStorage.setItem(AI_CACHE, JSON.stringify(all));
  } catch {
    /* ignore quota */
  }
}

export function QuizPage({ initialId }: { initialId?: string }) {
  const [articleId, setArticleId] = useState(initialId && getArticle(initialId) ? initialId : articles[0].id);
  const [mode, setMode] = useState<"flash" | "test" | "ai">("flash");
  const article = useMemo(() => getArticle(articleId) ?? articles[0], [articleId]);

  useEffect(() => {
    if (initialId && getArticle(initialId)) setArticleId(initialId);
  }, [initialId]);

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-24">
      <section className="space-y-4 rounded-xl border border-line bg-paper-card/95 p-6 text-center shadow-page">
        <h1 className="font-serif text-2xl font-bold">深度記憶提取箱</h1>
        <p className="text-sm text-muted">選擇文章，挑戰閃卡、仿真測驗，或請 AI 按篇章出新題。</p>
        <select
          value={article.id}
          onChange={(event) => setArticleId(event.target.value)}
          className="mx-auto w-full max-w-md rounded-lg border border-line bg-paper-deep p-3 text-center text-sm font-medium outline-none focus:ring-2 focus:ring-accent"
        >
          {articles.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </section>

      <div className="flex border-b border-line">
        {(
          [
            ["flash", `閃卡背誦（${article.f.length}）`],
            ["test", `仿真測驗（${article.q.length}）`],
            ["ai", "AI 出題"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            className={cn(
              "flex-1 py-4 text-sm font-bold",
              mode === key ? "border-b-2 border-accent text-accent" : "text-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "flash" ? (
        <FlashPanel key={article.id} cards={article.f} />
      ) : mode === "test" ? (
        <TestPanel key={article.id} articleId={article.id} title={article.title} questions={article.q} persist />
      ) : (
        <AiQuizPanel key={article.id} articleId={article.id} title={article.title} />
      )}
    </div>
  );
}

function FlashPanel({ cards }: { cards: { f: string; b: string }[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[index];

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => setFlipped((v) => !v)}
        className="relative flex min-h-[280px] w-full flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-line bg-paper-card p-8 text-center shadow-page transition-colors hover:border-accent"
      >
        <span
          className={cn(
            "mb-6 rounded-full px-3 py-1 text-xs font-bold tracking-widest",
            flipped ? "bg-seal/12 text-seal" : "bg-paper-deep text-muted",
          )}
        >
          {flipped ? "答案面" : "問題面"}
        </span>
        <p className="font-serif text-2xl font-bold leading-relaxed text-ink">{flipped ? card.b : card.f}</p>
        <p className="mt-8 text-[10px] text-muted">點擊卡片翻面</p>
      </button>
      <div className="flex items-center justify-between px-2">
        <span className="text-sm font-bold tabular-nums text-muted">
          {index + 1} / {cards.length}
        </span>
        <Button
          variant="ink"
          onClick={() => {
            setFlipped(false);
            setIndex((i) => (i + 1) % cards.length);
          }}
        >
          下一張
        </Button>
      </div>
    </div>
  );
}

function TestPanel({
  articleId,
  title,
  questions,
  persist,
}: {
  articleId: string;
  title: string;
  questions: QuizItem[];
  persist?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const question = questions[index];
  const [correctCount, setCorrectCount] = useState(0);

  if (!question) {
    return <p className="text-center text-sm text-muted">這篇暫時沒有題目。</p>;
  }

  if (done) {
    const percent = Math.round((correctCount / questions.length) * 100);
    const headline = percent >= 80 ? "太棒了！完美掌握！" : percent >= 50 ? "表現不錯，繼續保持！" : "要再加油喔！";
    return (
      <div className="rounded-xl border border-line bg-paper-card p-8 text-center shadow-page">
        <div className="mx-auto mb-4 inline-flex rounded-full bg-accent-mist p-3 text-accent">
          <Award className="size-10" />
        </div>
        <h2 className="font-serif text-xl font-bold">《{title}》測驗結算</h2>
        <p className="mt-2 text-ink-soft">{headline}</p>
        <div className="mx-auto mt-5 max-w-sm rounded-lg border border-line bg-paper-deep p-5">
          <div className="text-xs font-semibold text-muted">本次答對成績</div>
          <div className="mt-1 text-3xl font-extrabold tabular-nums text-accent">
            {correctCount}{" "}
            <span className="text-base font-normal text-muted">
              / {questions.length} 題（{percent}%）
            </span>
          </div>
        </div>
        <Button
          className="mt-6"
          onClick={() => {
            if (persist) clearAnswers(articleId);
            setIndex(0);
            setPicked(null);
            setDone(false);
            setCorrectCount(0);
          }}
        >
          <RotateCcw className="size-4" /> 再測一次
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 rounded-xl border border-line bg-paper-card p-6 shadow-page sm:p-10">
      <span className="rounded-md bg-accent-mist px-3 py-1 text-xs font-bold text-accent">
        Q{index + 1} / {questions.length}
      </span>
      <h2 className="font-serif text-xl font-bold leading-relaxed sm:text-2xl">{question.q}</h2>
      <div className="grid grid-cols-1 gap-4">
        {question.o.map((opt, i) => {
          const revealed = picked !== null;
          const isCorrect = i === question.a;
          const isWrong = revealed && i === picked && !isCorrect;
          return (
            <button
              key={opt}
              type="button"
              disabled={revealed}
              onClick={() => {
                if (picked !== null) return;
                setPicked(i);
                const ok = i === question.a;
                if (ok) setCorrectCount((n) => n + 1);
                if (persist) recordQuizAnswer(articleId, index, ok);
              }}
              className={cn(
                "w-full rounded-lg border-2 p-5 text-left text-base font-medium transition-colors",
                !revealed && "border-line hover:border-accent hover:bg-accent-mist/40",
                revealed && isCorrect && "border-ok bg-ok/10 font-bold text-ok",
                isWrong && "border-bad bg-bad/10 text-bad",
                revealed && !isCorrect && !isWrong && "border-line opacity-60",
              )}
            >
              {i + 1}. {opt}
            </button>
          );
        })}
      </div>
      {picked !== null ? (
        <div className="space-y-4 border-t border-line pt-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <span className={cn("flex items-center gap-2 text-base font-bold", picked === question.a ? "text-ok" : "text-bad")}>
              {picked === question.a ? (
                <>
                  <CheckCircle2 className="size-6" /> 完全正確
                </>
              ) : (
                <>
                  <XCircle className="size-6" /> 正確答案是選項 {question.a + 1}
                </>
              )}
            </span>
            <Button
              onClick={() => {
                if (index >= questions.length - 1) {
                  setDone(true);
                  return;
                }
                setPicked(null);
                setIndex((n) => n + 1);
              }}
            >
              {index >= questions.length - 1 ? "查看成績" : "下一題"}
            </Button>
          </div>
          <QuizExplain
            key={`${articleId}-${index}-${picked}`}
            articleTitle={title}
            question={question.q}
            options={question.o}
            correctIndex={question.a}
            pickedIndex={picked}
          />
        </div>
      ) : null}
    </div>
  );
}

function AiQuizPanel({ articleId, title }: { articleId: string; title: string }) {
  const [questions, setQuestions] = useState<QuizItem[] | null>(() => readAiCache(articleId));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const result = await askGenerateQuiz(articleId);
      if (result.ok) {
        setQuestions(result.questions);
        writeAiCache(articleId, result.questions);
      } else {
        setError(result.error);
      }
    } catch {
      setError("連線失敗，請稍後再試。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-line bg-paper-card p-5 shadow-page">
        <p className="text-sm leading-relaxed text-ink-soft">
          按本篇原文、詞解與論點即時出一組新選擇題。題目會暫存在這部裝置，可隨時再練。AI 偶有誤差，請以課文為準。
        </p>
        <Button className="mt-4" onClick={() => void generate()} disabled={busy}>
          <Sparkles className="size-4" />
          {busy ? "正在出題…" : questions ? "再出一組新題" : "請 AI 出題"}
        </Button>
        {error ? <p className="mt-3 text-sm text-bad">{error}</p> : null}
      </div>
      {questions ? (
        <TestPanel key={`${articleId}-${questions[0]?.q}`} articleId={articleId} title={title} questions={questions} />
      ) : null}
    </div>
  );
}
