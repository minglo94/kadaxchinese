import { useRouterState } from "@tanstack/react-router";
import { Bot, Send, Settings2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { GeminiSetup } from "@/components/ai/GeminiSetup";
import { Button } from "@/components/ui/button";
import { getArticle } from "@/data/articles";
import { aiStatus } from "@/lib/ai";
import { askTutor } from "@/lib/ask-ai";
import { getGeminiKey } from "@/lib/gemini-key";
import { useUiStore } from "@/lib/ui-store";
import { cn } from "@/lib/utils";

const SUGGEST = [
  "這句的白話語譯是什麼？",
  "這篇的主旨與論證結構？",
  "列出三個必考實詞。",
];

type Msg = { role: "user" | "assistant"; content: string };
type Status = { geminiEnv: boolean; xaiEnv: boolean };

export function TutorDock() {
  const open = useUiStore((s) => s.tutorOpen);
  const setOpen = useUiStore((s) => s.setTutorOpen);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const articleId = pathname.match(/^\/read\/([^/]+)/)?.[1];
  const article = articleId ? getArticle(articleId) : undefined;
  const inGame = pathname.startsWith("/games/");

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [hasLocalKey, setHasLocalKey] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const placeholder = useMemo(
    () => (article ? `問《${article.title.replace(/[《》]/g, "")}》…` : "向書齋助教提問…"),
    [article],
  );

  useEffect(() => {
    if (!open) return;
    setHasLocalKey(Boolean(getGeminiKey()));
    void aiStatus()
      .then(setStatus)
      .catch(() => setStatus(null));
  }, [open]);

  const ready = hasLocalKey || Boolean(status?.geminiEnv || status?.xaiEnv);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    if (!ready) {
      setSettings(true);
      setError("請先連接 Gemini API 金鑰。");
      return;
    }
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setError(null);
    try {
      const result = await askTutor({ articleId, messages: next });
      if (result.ok) {
        setMessages([...next, { role: "assistant", content: result.text }]);
      } else {
        setError(result.error);
        if (result.needsKey) setSettings(true);
      }
    } catch {
      setError("連線失敗，請稍後再試。");
    } finally {
      setBusy(false);
      window.setTimeout(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      }, 40);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed z-[60] inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink text-sm font-medium text-paper shadow-page hover:opacity-90",
          inGame ? "bottom-24 right-4" : "bottom-5 right-4",
          "w-12 sm:w-auto sm:px-4",
        )}
        aria-label="開啟 AI 助教"
      >
        <Bot className="size-4" />
        <span className="hidden sm:inline">AI 助教</span>
      </button>

      {open ? (
        <div
          className={cn(
            "fixed right-4 z-[70] flex h-[min(72vh,520px)] w-[min(calc(100vw-2rem),380px)] flex-col overflow-hidden rounded-xl border border-line bg-paper-card shadow-page",
            inGame ? "bottom-40" : "bottom-20",
          )}
        >
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <p className="font-serif text-base font-bold">書齋助教</p>
              <p className="text-[11px] text-muted">
                {article ? `正在讀 ${article.title}` : "十二篇指定範文隨時問"}
                {hasLocalKey || status?.geminiEnv ? " · Gemini" : ready ? " · 已連線" : " · 未連線"}
              </p>
            </div>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setSettings((value) => !value)}
                className={cn(
                  "rounded-md p-2 hover:bg-paper-deep",
                  settings ? "text-accent" : "text-muted",
                )}
                aria-label="AI 連線設定"
              >
                <Settings2 className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-2 text-muted hover:bg-paper-deep"
                aria-label="關閉"
              >
                <X className="size-4" />
              </button>
            </div>
          </header>
          {settings ? (
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <GeminiSetup
                status={status}
                onSaved={() => {
                  setHasLocalKey(Boolean(getGeminiKey()));
                  setError(null);
                }}
              />
            </div>
          ) : (
            <>
              <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
                {messages.length === 0 ? (
                  <div className="space-y-3 pt-2">
                    <p className="text-sm leading-relaxed text-ink-soft">
                      可以問語譯、詞義、寫作手法或默書易錯點。助教會根據指定範文回答。
                    </p>
                    {!ready ? (
                      <button
                        type="button"
                        onClick={() => setSettings(true)}
                        className="w-full rounded-lg border border-accent bg-accent-mist px-3 py-2 text-left text-sm text-ink"
                      >
                        尚未連接 Gemini，點此貼上 API 金鑰。
                      </button>
                    ) : null}
                    <div className="flex flex-col gap-2">
                      {SUGGEST.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => send(item)}
                          className="rounded-lg border border-line bg-paper-deep px-3 py-2 text-left text-sm text-ink hover:border-accent"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        "max-w-[92%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                        msg.role === "user" ? "ml-auto bg-accent text-accent-fg" : "bg-paper-deep text-ink",
                      )}
                    >
                      {msg.content}
                    </div>
                  ))
                )}
                {busy ? <p className="text-xs text-muted">正在批閱…</p> : null}
                {error ? <p className="text-xs text-bad">{error}</p> : null}
              </div>
              <form
                className="flex gap-2 border-t border-line p-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void send(input);
                }}
              >
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={placeholder}
                  className="h-11 flex-1 rounded-md border border-line bg-paper-deep px-3 text-sm outline-none focus:ring-2 focus:ring-accent"
                />
                <Button type="submit" size="icon" disabled={busy || !input.trim()} aria-label="送出">
                  <Send className="size-4" />
                </Button>
              </form>
            </>
          )}
        </div>
      ) : null}
    </>
  );
}
