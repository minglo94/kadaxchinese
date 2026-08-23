import { Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { askExplain, askGrade } from "@/lib/ask-ai";

export function QuizExplain({
  articleTitle,
  question,
  options,
  correctIndex,
  pickedIndex,
}: {
  articleTitle: string;
  question: string;
  options: string[];
  correctIndex: number;
  pickedIndex: number;
}) {
  const [text, setText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const result = await askExplain({ articleTitle, question, options, correctIndex, pickedIndex });
      if (result.ok) setText(result.text);
      else setError(result.error);
    } catch {
      setError("連線失敗，請稍後再試。");
    } finally {
      setBusy(false);
    }
  }

  if (text) {
    return (
      <div className="rounded-lg border border-line bg-paper-deep p-4 text-sm leading-relaxed text-ink-soft whitespace-pre-wrap">
        <p className="mb-1 text-xs font-bold tracking-wide text-accent">AI 解析</p>
        {text}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" size="sm" onClick={() => void run()} disabled={busy}>
        <Sparkles className="size-4" />
        {busy ? "解析中…" : "請 AI 解析"}
      </Button>
      {error ? <p className="text-xs text-bad">{error}</p> : null}
    </div>
  );
}

export function DictationGrade({
  articleTitle,
  sentence,
  expected,
  given,
}: {
  articleTitle: string;
  sentence: string;
  expected: string[];
  given: string[];
}) {
  const [text, setText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const result = await askGrade({ articleTitle, sentence, expected, given });
      if (result.ok) setText(result.text);
      else setError(result.error);
    } catch {
      setError("連線失敗，請稍後再試。");
    } finally {
      setBusy(false);
    }
  }

  if (text) {
    return (
      <div className="rounded-lg border border-line bg-paper-deep p-4 text-sm leading-relaxed text-ink-soft whitespace-pre-wrap">
        <p className="mb-1 text-xs font-bold tracking-wide text-accent">AI 彈性評分</p>
        {text}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" size="sm" onClick={() => void run()} disabled={busy}>
        <Sparkles className="size-4" />
        {busy ? "評閱中…" : "請 AI 彈性評分"}
      </Button>
      {error ? <p className="text-xs text-bad">{error}</p> : null}
    </div>
  );
}
