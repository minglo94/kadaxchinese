import { Navigate, useNavigate } from "@tanstack/react-router";
import { GraduationCap, Loader2, School, ShieldCheck, Users } from "lucide-react";
import { useState } from "react";
import { PageSkeleton } from "@/components/auth/RoleGate";
import { useProfile } from "@/components/auth/use-profile";
import { Button } from "@/components/ui/button";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useProfileStore } from "@/lib/classroom/profile-store";
import { roleHome, type Role } from "@/lib/classroom/types";
import { cn } from "@/lib/utils";

export function OnboardingPage() {
  const { user } = useCurrentUserState();
  const { profile, isPending, signedOut } = useProfile();
  const chooseRole = useProfileStore((s) => s.chooseRole);
  const navigate = useNavigate();

  const [picked, setPicked] = useState<Role | null>(null);
  const [teacherCode, setTeacherCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isPending) return <PageSkeleton />;
  if (signedOut) return <RedirectToSignIn />;
  // Role already chosen — this page has nothing left to ask.
  if (profile) return <Navigate to={roleHome(profile.role)} />;
  if (profile === undefined) return <PageSkeleton />;

  const submit = async (role: Role) => {
    setError(null);
    setBusy(true);
    try {
      const result = await chooseRole(role, role === "student" ? undefined : teacherCode);
      if (role === "student") {
        await navigate({
          to: "/me",
          search: result.joinedClassroomIds.length > 0 ? { joined: 1 } : undefined,
        });
      } else {
        await navigate({ to: roleHome(role) });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "未能儲存身分，請再試一次。");
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-serif text-2xl font-bold text-ink sm:text-3xl">
        歡迎，{user?.displayName ?? "同學"}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        請選擇你的身分。這個選擇決定你看到的介面，之後可以在帳戶選單更改。
      </p>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <RoleCard
          icon={GraduationCap}
          title="我是學生"
          points={["進度、能力分析同步到帳戶", "用班房代碼加入老師的班", "看到個人溫習建議"]}
          selected={picked === "student"}
          onSelect={() => {
            setPicked("student");
            setError(null);
          }}
        />
        <RoleCard
          icon={Users}
          title="我是老師"
          points={["開班房、派 6 位代碼", "貼上學生電郵名單", "查看全班進度與弱項"]}
          selected={picked === "teacher"}
          onSelect={() => {
            setPicked("teacher");
            setError(null);
          }}
          note="需要教師碼"
        />
        <RoleCard
          icon={School}
          title="我是科主任"
          points={["全校班房與學生總覽", "全校最弱範文排行", "跨班找出需要跟進的學生"]}
          selected={picked === "admin"}
          onSelect={() => {
            setPicked("admin");
            setError(null);
          }}
          note="需要科主任碼"
        />
      </div>

      {(picked === "teacher" || picked === "admin") && (
        <div className="mt-5 rounded-xl border border-line bg-paper-card p-5 shadow-page">
          <label htmlFor="teacher-code" className="block text-sm font-semibold text-ink">
            {picked === "teacher" ? "教師碼" : "科主任碼"}
          </label>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {picked === "teacher"
              ? "由學校負責老師提供。這道關卡是為了避免學生自稱老師。"
              : "由學校管理層提供。科主任看得到全校每一位學生的成績，所以這道關卡比教師碼更重要。"}
          </p>
          <input
            id="teacher-code"
            value={teacherCode}
            onChange={(event) => setTeacherCode(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            // 不要在這裡寫出真實或回退的碼 —— placeholder 會被打包進瀏覽器
            // bundle，等於把碼公開給每一個學生。
            placeholder={picked === "teacher" ? "請輸入教師碼" : "請輸入科主任碼"}
            className="mt-3 h-11 w-full rounded-md border border-line bg-paper px-3 text-sm text-ink outline-none focus:border-accent"
          />
        </div>
      )}

      {picked === "student" && (
        <p className="mt-5 flex items-start gap-2 rounded-lg border border-line bg-paper-deep/60 p-4 text-xs leading-relaxed text-ink-soft">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" />
          加入班房後，該班房的老師會看到你的姓名、電郵與練習成績。不加入班房則只有你自己看到。
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-seal">
          {error}
        </p>
      )}

      <Button
        size="lg"
        className="mt-6 w-full sm:w-auto"
        disabled={picked === null || busy || (picked !== "student" && teacherCode.trim() === "")}
        onClick={() => picked && void submit(picked)}
      >
        {busy && <Loader2 className="size-4 animate-spin" />}
        {picked === "teacher" ? "以老師身分開始" : picked === "admin" ? "以科主任身分開始" : "開始"}
      </Button>
    </div>
  );
}

function RoleCard({
  icon: Icon,
  title,
  points,
  selected,
  onSelect,
  note,
}: {
  icon: typeof Users;
  title: string;
  points: string[];
  selected: boolean;
  onSelect: () => void;
  note?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "rounded-xl border-2 bg-paper-card p-5 text-left transition-colors",
        selected ? "border-accent bg-accent-mist/30" : "border-line hover:border-accent/60",
      )}
    >
      <span className="flex items-center gap-2">
        <Icon className={cn("size-5", selected ? "text-accent" : "text-ink-soft")} />
        <strong className="font-serif text-lg text-ink">{title}</strong>
        {note && (
          <span className="ml-auto rounded-full bg-seal/12 px-2 py-0.5 text-[10px] font-bold text-seal">
            {note}
          </span>
        )}
      </span>
      <ul className="mt-3 space-y-1.5">
        {points.map((point) => (
          <li key={point} className="flex gap-2 text-sm text-ink-soft">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent/60" />
            {point}
          </li>
        ))}
      </ul>
    </button>
  );
}
