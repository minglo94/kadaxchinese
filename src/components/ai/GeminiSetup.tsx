import { CheckCircle2, ExternalLink, KeyRound, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { pingAssistant } from "@/lib/ask-ai";
import { isGeminiAuthKey, sanitizeGeminiKey } from "@/lib/gemini";
import { clearGeminiKey, getGeminiKey, setGeminiKey } from "@/lib/gemini-key";

type Status = { geminiEnv: boolean; xaiEnv: boolean };

export function GeminiSetup({
  status,
  onSaved,
}: {
  status: Status | null;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const existing = getGeminiKey();
    setSaved(existing);
    setDraft(existing);
  }, []);

  async function saveAndTest() {
    const key = sanitizeGeminiKey(draft);
    if (!key && !status?.geminiEnv && !status?.xaiEnv) {
      setOk(false);
      setMessage("請先貼上 Gemini API 金鑰。");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      if (key) setGeminiKey(key);
      else clearGeminiKey();
      const result = await pingAssistant(key);
      if (result.ok) {
        setSaved(key);
        setOk(true);
        setMessage(
          !key
            ? "已使用網站後台金鑰連線。"
            : isGeminiAuthKey(key)
              ? "已連接 Gemini（新版 AQ 金鑰）。"
              : "已連接 Gemini。",
        );
        onSaved();
      } else {
        setOk(false);
        setMessage(result.error);
      }
    } catch {
      setOk(false);
      setMessage("連線失敗，請檢查金鑰後再試。");
    } finally {
      setBusy(false);
    }
  }

  function remove() {
    clearGeminiKey();
    setDraft("");
    setSaved("");
    setOk(false);
    setMessage("已清除本機金鑰。");
    onSaved();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <KeyRound className="mt-0.5 size-4 shrink-0 text-accent" />
        <div>
          <p className="text-sm font-bold text-ink">連接 Gemini 助教</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {status?.geminiEnv
              ? "網站已設定 Gemini 3.5，可直接提問。也可另貼自己的金鑰。"
              : "貼上 Google AI Studio 金鑰後，瀏覽器會直接連 Gemini 3.5 Flash（不再使用已停用的 2.5 / 2.0）。"}
          </p>
        </div>
      </div>

      <ol className="list-decimal space-y-1 pl-4 text-xs leading-relaxed text-ink-soft">
        <li>
          開啟{" "}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
          >
            Google AI Studio
            <ExternalLink className="size-3" />
          </a>
        </li>
        <li>建立 API key，複製後貼到下方。新金鑰多以 AQ. 開頭，舊金鑰以 AIza 開頭，兩種都支援。</li>
        <li>按「儲存並測試」。金鑰只留在這部裝置，不會寫進 GitHub。</li>
      </ol>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">Gemini API 金鑰</span>
        <input
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="AIza… 或 AQ.…"
          className="h-11 w-full rounded-md border border-line bg-paper-deep px-3 text-sm outline-none focus:ring-2 focus:ring-accent"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => void saveAndTest()} disabled={busy}>
          {busy ? "測試中…" : "儲存並測試"}
        </Button>
        {saved ? (
          <Button size="sm" variant="outline" onClick={remove}>
            <Trash2 className="size-3.5" />
            清除
          </Button>
        ) : null}
      </div>

      {message ? (
        <p className={`flex items-start gap-1.5 text-xs leading-relaxed ${ok ? "text-ok" : "text-bad"}`}>
          {ok ? <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" /> : null}
          {message}
        </p>
      ) : saved ? (
        <p className="flex items-center gap-1.5 text-xs text-ok">
          <CheckCircle2 className="size-3.5" />
          本機已儲存 Gemini 金鑰
        </p>
      ) : null}

      <p className="text-xs leading-relaxed text-muted">
        若要全班共用、學生不用各自申請，到 Vercel → Settings → Environment Variables 新增{" "}
        <span className="font-mono text-ink-soft">GEMINI_API_KEY</span>，再 Redeploy。
      </p>
    </div>
  );
}
