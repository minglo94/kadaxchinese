import { Navigate } from "@tanstack/react-router";
import { BookOpen, GraduationCap, LineChart, Loader2, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";

/** Where a fresh sign-in lands: the role picker decides teacher vs student. */
const AFTER_SIGN_IN = "/onboarding";

const SELLING_POINTS = [
  {
    icon: LineChart,
    title: "進度跟著你走",
    body: "測驗、默書與闖關成績存到帳戶，換手機、換電腦都接得上。",
  },
  {
    icon: Users,
    title: "老師可以開班房",
    body: "派一個六位班房代碼，或直接貼上學生電郵名單，全班即刻連上。",
  },
  {
    icon: GraduationCap,
    title: "看得見弱項",
    body: "內容理解、字詞、默寫逐項評估，並給出下一步溫習建議。",
  },
];

export function LoginPage() {
  const { user } = useCurrentUserState();
  const hydrated = useHydrated();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Already signed in — no reason to show the door again. Gated on `hydrated`
  // so the server and the first client render agree (no hydration mismatch).
  if (hydrated && user) return <Navigate to={AFTER_SIGN_IN} />;

  const google = GROK_PROVIDERS.find((p) => p.providerId === "grok-google");
  const others = GROK_PROVIDERS.filter((p) => p.providerId !== "grok-google");

  const start = (providerId: string) => {
    setError(null);
    setBusy(providerId);
    void signIn(providerId, { callbackURL: AFTER_SIGN_IN }).catch(() => {
      setBusy(null);
      setError("登入未能完成，請再試一次。");
    });
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-14">
      <section>
        <span className="inline-flex items-center gap-2 rounded-full bg-accent-mist px-3 py-1 text-xs font-bold text-accent">
          <BookOpen className="size-3.5" />
          範文十二式 · 課堂版
        </span>
        <h1 className="mt-4 font-serif text-3xl font-bold leading-tight text-ink sm:text-4xl">
          一個入口，
          <br className="hidden sm:block" />
          老師與學生共用
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
          用 Google 帳戶登入，之後選擇「我是老師」或「我是學生」。
          未登入也可以繼續讀範文、做測驗、玩闖關，只是成績只留在這部裝置。
        </p>

        <ul className="mt-7 space-y-4">
          {SELLING_POINTS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-3">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-md bg-paper-deep text-accent">
                <Icon className="size-4" />
              </span>
              <div>
                <strong className="block font-serif text-base text-ink">{title}</strong>
                <span className="text-sm leading-relaxed text-muted">{body}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-line bg-paper-card p-6 shadow-page sm:p-8">
        <h2 className="font-serif text-xl font-bold text-accent">登入</h2>
        <p className="mt-1 text-sm text-muted">首次登入會即時建立帳戶，不需另外註冊。</p>

        {!authEnabled ? (
          <p className="mt-6 rounded-lg border border-line bg-paper-deep/70 p-4 text-sm text-ink-soft">
            登入功能尚未開啟。
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            {google && (
              <Button
                size="lg"
                className="w-full"
                disabled={busy !== null || !hydrated}
                onClick={() => start(google.providerId)}
              >
                {busy === google.providerId ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <GoogleMark />
                )}
                用 Google 登入
              </Button>
            )}

            {others.length > 0 && (
              <>
                <div className="flex items-center gap-3 py-1 text-xs text-muted">
                  <span className="h-px flex-1 bg-line" />
                  或
                  <span className="h-px flex-1 bg-line" />
                </div>
                {others.map((provider) => (
                  <Button
                    key={provider.providerId}
                    variant="outline"
                    size="lg"
                    className="w-full"
                    disabled={busy !== null || !hydrated}
                    onClick={() => start(provider.providerId)}
                  >
                    {busy === provider.providerId && <Loader2 className="size-4 animate-spin" />}用{" "}
                    {provider.label} 登入
                  </Button>
                ))}
              </>
            )}

            <p
              className={cn(
                "text-sm text-seal transition-opacity",
                error ? "opacity-100" : "opacity-0",
              )}
              role={error ? "alert" : undefined}
            >
              {error ?? " "}
            </p>
          </div>
        )}

        <p className="mt-2 text-xs leading-relaxed text-muted">
          加入班房後，該班房的老師會看到你的姓名、電郵與練習成績。
        </p>
      </section>
    </div>
  );
}

/** Google 的四色 G，內嵌 SVG 以免依賴外部圖檔。 */
function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}
