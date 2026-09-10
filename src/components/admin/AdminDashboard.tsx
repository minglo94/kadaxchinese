import { Link } from "@tanstack/react-router";
import { AlertTriangle, School, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageSkeleton, RequireRole } from "@/components/auth/RoleGate";
import { AbilityChart } from "@/components/dashboard/AbilityChart";
import { schoolOverview, type SchoolOverview } from "@/lib/classroom/server-fns";
import { cn } from "@/lib/utils";

/** 科主任：全校總覽（唯讀）。 */
export function AdminDashboard() {
  return <RequireRole role="admin">{() => <AdminBody />}</RequireRole>;
}

function AdminBody() {
  const [data, setData] = useState<SchoolOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    schoolOverview()
      .then(setData)
      .catch(() => setError("未能讀取全校資料。"));
  }, []);

  const classes = useMemo(() => {
    if (!data) return [];
    const needle = query.trim().toLowerCase();
    if (!needle) return data.classes;
    return data.classes.filter(
      (row) =>
        row.name.toLowerCase().includes(needle) ||
        (row.teacherName ?? "").toLowerCase().includes(needle) ||
        (row.teacherEmail ?? "").toLowerCase().includes(needle),
    );
  }, [data, query]);

  if (error) {
    return (
      <p role="alert" className="rounded-lg border border-line bg-paper-card p-4 text-sm text-seal">
        {error}
      </p>
    );
  }
  if (!data) return <PageSkeleton />;

  const { totals } = data;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 font-serif text-2xl font-bold text-ink sm:text-3xl">
          <School className="size-6 text-accent" />
          全校總覽
        </h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          科主任檢視：全校每個班房與學生的進度。此頁為唯讀，班房設定仍由各班老師管理。
        </p>
      </header>

      {/* KPI 一列：儀表板要先讓人看到的幾個數字 */}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="班房" value={totals.classrooms} />
        <Kpi label="老師" value={totals.teachers} />
        <Kpi label="學生" value={totals.students} note={`${totals.activeStudents} 位有紀錄`} />
        <Kpi
          label="全校平均答對率"
          value={totals.avgPercent === null ? "—" : `${totals.avgPercent}%`}
          note={totals.avgPercent === null ? "尚無練習紀錄" : "只計有紀錄的學生"}
        />
      </dl>

      <div className="grid gap-6 lg:grid-cols-2">
        <AbilityChart primary={{ label: "全校平均", dimensions: data.ability }} />

        <section className="rounded-xl border border-line bg-paper-card p-5 shadow-page sm:p-6">
          <h2 className="font-serif text-lg font-bold text-accent">全校最弱的範文</h2>
          <p className="mt-0.5 text-xs text-muted">以有作答紀錄的學生的平均答對率排序。</p>
          {data.weakArticles.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">還沒有足夠的作答紀錄。</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.weakArticles.map((article) => (
                <li key={article.id}>
                  <div className="mb-1 flex items-baseline justify-between gap-3">
                    <span className="font-serif font-bold text-ink">{article.title}</span>
                    <span className="text-sm font-bold tabular-nums text-ink-soft">
                      {article.percent}%
                      <span className="ml-2 text-[11px] font-medium text-muted">
                        {article.sampleStudents} 人
                      </span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-paper-deep">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        article.percent >= 80
                          ? "bg-ok"
                          : article.percent >= 50
                            ? "bg-accent"
                            : "bg-seal",
                      )}
                      style={{ width: `${article.percent}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-line bg-paper-card p-5 shadow-page sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-accent">
              <Users className="size-4" />
              各班進度
            </h2>
            <p className="mt-0.5 text-xs text-muted">點班房名稱可看該班的完整報告。</p>
          </div>
          <label className="text-xs text-muted">
            <span className="sr-only">搜尋班房或老師</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜尋班房或老師"
              className="h-9 w-44 rounded-md border border-line bg-paper px-3 text-sm text-ink outline-none focus:border-accent"
            />
          </label>
        </div>

        {classes.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">
            {data.classes.length === 0 ? "全校還沒有班房。" : "沒有符合搜尋的班房。"}
          </p>
        ) : (
          <div className="mt-4 -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th scope="col" className="py-2 font-medium">
                    班房
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    老師
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    學生
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    有紀錄
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    平均答對率
                  </th>
                </tr>
              </thead>
              <tbody>
                {classes.map((row) => (
                  <tr key={row.id} className="border-b border-line/60 last:border-0">
                    <td className="py-2.5">
                      <Link
                        to="/teacher/class/$classId"
                        params={{ classId: String(row.id) }}
                        className="font-medium text-ink hover:text-accent"
                      >
                        {row.name}
                      </Link>
                      {row.subject && (
                        <span className="block text-[11px] text-muted">{row.subject}</span>
                      )}
                    </td>
                    <td className="py-2.5 text-ink-soft">
                      {row.teacherName ?? "—"}
                      {row.teacherEmail && (
                        <span className="block text-[11px] text-muted">{row.teacherEmail}</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-ink-soft">
                      {row.studentCount}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-ink-soft">
                      {row.activeCount}
                    </td>
                    <td
                      className={cn(
                        "py-2.5 text-right font-bold tabular-nums",
                        row.avgPercent === null
                          ? "text-muted"
                          : row.avgPercent >= 80
                            ? "text-ok"
                            : row.avgPercent >= 50
                              ? "text-ink"
                              : "text-seal",
                      )}
                    >
                      {row.avgPercent === null ? "—" : `${row.avgPercent}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-line bg-paper-card p-5 shadow-page sm:p-6">
        <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-accent">
          <AlertTriangle className="size-4" />
          最需要跟進
        </h2>
        <p className="mt-0.5 text-xs text-muted">
          有練習紀錄但答對率最低的學生，跨班排序；只列前十位。
        </p>
        {data.attention.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">還沒有學生有練習紀錄。</p>
        ) : (
          <ul className="mt-4 space-y-1.5">
            {data.attention.map((student) => (
              <li
                key={`${student.classroomId}-${student.userId}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-paper-deep/50 px-3 py-2 text-sm"
              >
                <span className="min-w-0">
                  <Link
                    to="/teacher/class/$classId/student/$studentId"
                    params={{
                      classId: String(student.classroomId),
                      studentId: student.userId,
                    }}
                    className="font-medium text-ink hover:text-accent"
                  >
                    {student.displayName ?? student.email ?? "（未命名）"}
                  </Link>
                  <span className="ml-2 text-xs text-muted">{student.className}</span>
                </span>
                <span className="flex items-center gap-3 text-xs">
                  <span className="text-muted">
                    {student.weakestLabel ? `最弱：${student.weakestLabel}` : "資料不足"}
                  </span>
                  <span
                    className={cn(
                      "font-bold tabular-nums",
                      student.overallPercent >= 50 ? "text-ink" : "text-seal",
                    )}
                  >
                    {student.overallPercent}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Kpi({ label, value, note }: { label: string; value: number | string; note?: string }) {
  return (
    <div className="rounded-xl border border-line bg-paper-card px-4 py-3 shadow-page">
      <dt className="text-[11px] text-muted">{label}</dt>
      <dd className="mt-0.5 font-serif text-2xl font-bold tabular-nums text-ink">{value}</dd>
      {note && <dd className="text-[11px] text-muted">{note}</dd>}
    </div>
  );
}
