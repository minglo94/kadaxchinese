import { ArrowRight, Check, CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DictationGrade } from "@/components/ai/AiExplain";
import { Button } from "@/components/ui/button";
import { parseBlanks } from "@/data/games";
import { articles, getArticle } from "@/data/articles";
import { saveDictationResult } from "@/lib/progress";
import { cn } from "@/lib/utils";

function blankCount(text: string) {
  return (text.match(/\{[^}]+\}/g) ?? []).length;
}

export function DictationPage({ initialId }: { initialId?: string }) {
  const startId = initialId && getArticle(initialId) ? initialId : articles[0].id;
  const [articleId, setArticleId] = useState(startId);
  const article = useMemo(() => getArticle(articleId) ?? articles[0], [articleId]);
  const list = article.dictation;
  const [index, setIndex] = useState(0);
  const [checked, setChecked] = useState(false);
  const [values, setValues] = useState<string[]>(() => Array.from({ length: blankCount(list[0]?.text ?? "") }, () => ""));
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (initialId && getArticle(initialId)) {
      setArticleId(initialId);
      setCorrectCount(0);
      setIndex(0);
      setChecked(false);
      setFinished(false);
      const next = getArticle(initialId)?.dictation[0]?.text ?? "";
      setValues(Array.from({ length: blankCount(next) }, () => ""));
    }
  }, [initialId]);

  const current = list[index];
  const parsed = useMemo(() => parseBlanks(current?.text ?? ""), [current]);
  const blanks = parsed.filter((part) => part.type === "blank") as Array<{ type: "blank"; answer: string; index: number }>;
  const exact = blanks.every((blank) => (values[blank.index] ?? "").trim() === blank.answer);

  function resetFor(nextIndex: number, nextId = articleId) {
    const next = (getArticle(nextId) ?? article).dictation[nextIndex];
    setIndex(nextIndex);
    setChecked(false);
    setValues(Array.from({ length: blankCount(next?.text ?? "") }, () => ""));
    setFinished(false);
  }

  function switchArticle(id: string) {
    setArticleId(id);
    setCorrectCount(0);
    resetFor(0, id);
  }

  function check() {
    if (exact) setCorrectCount((n) => n + 1);
    setChecked(true);
  }

  function next() {
    if (index < list.length - 1) {
      resetFor(index + 1);
      return;
    }
    saveDictationResult(article.id, correctCount, list.length);
    setFinished(true);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-24">
      <section className="flex flex-col justify-between gap-4 rounded-xl border border-line bg-paper-card/95 p-6 shadow-page sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-xl font-bold">範文名句默書</h1>
          <p className="mt-1 text-xs text-muted">在空格內填入正確的文言文字詞；寫錯可請 AI 彈性評分</p>
        </div>
        <select
          value={article.id}
          onChange={(event) => switchArticle(event.target.value)}
          className="rounded-lg border border-line bg-paper-deep px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-accent"
        >
          {articles.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </section>

      {finished ? (
        <div className="rounded-xl border border-line bg-paper-card p-8 text-center shadow-page">
          <h2 className="font-serif text-xl font-bold">《{article.title}》默書完成</h2>
          <p className="mt-3 text-3xl font-extrabold tabular-nums text-accent">
            {correctCount} <span className="text-base font-normal text-muted">/ {list.length} 題</span>
          </p>
          <Button
            className="mt-6"
            onClick={() => {
              setCorrectCount(0);
              resetFor(0);
            }}
          >
            再默一次
          </Button>
        </div>
      ) : (
        <section className="space-y-6 rounded-xl border border-line bg-paper-card/95 p-6 shadow-page sm:p-8">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <span className="rounded-full bg-accent-mist px-3 py-1 text-xs font-bold text-accent">
              第 {index + 1} / {list.length} 題
            </span>
            <span className="font-serif text-sm text-muted">{article.title}</span>
          </div>

          <div className="classic-text flex min-h-[100px] flex-wrap items-center gap-2 text-lg sm:text-xl">
            {parsed.map((part, i) =>
              part.type === "text" ? (
                <span key={i}>{part.value}</span>
              ) : (
                <input
                  key={`${index}-${part.index}`}
                  value={
                    checked
                      ? (values[part.index] ?? "").trim() === part.answer
                        ? part.answer
                        : `${values[part.index] || "空白"}（正解：${part.answer}）`
                      : (values[part.index] ?? "")
                  }
                  disabled={checked}
                  onChange={(event) => {
                    const nextVals = [...values];
                    nextVals[part.index] = event.target.value;
                    setValues(nextVals);
                  }}
                  placeholder={`${part.answer.length} 字`}
                  className={cn(
                    "min-w-[5rem] border-b-2 bg-transparent px-2 py-1 text-center font-bold outline-none",
                    checked
                      ? (values[part.index] ?? "").trim() === part.answer
                        ? "border-ok text-ok"
                        : "border-bad text-bad"
                      : "border-accent text-accent",
                  )}
                />
              ),
            )}
          </div>

          <div className="space-y-4 border-t border-line pt-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium">
                {checked ? (
                  exact ? (
                    <span className="flex items-center gap-1 text-ok">
                      <CheckCircle2 className="size-5" /> 完全默對
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-bad">
                      <XCircle className="size-5" /> 請對照正確解答
                    </span>
                  )
                ) : null}
              </div>
              {checked ? (
                <Button variant="ink" onClick={next}>
                  {index >= list.length - 1 ? "完成" : "下一題"} <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button onClick={check}>
                  <Check className="size-4" /> 檢查答案
                </Button>
              )}
            </div>
            {checked && !exact ? (
              <DictationGrade
                key={`${article.id}-${index}`}
                articleTitle={article.title}
                sentence={current.text.replace(/[{}]/g, "")}
                expected={blanks.map((blank) => blank.answer)}
                given={blanks.map((blank) => values[blank.index] ?? "")}
              />
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}
