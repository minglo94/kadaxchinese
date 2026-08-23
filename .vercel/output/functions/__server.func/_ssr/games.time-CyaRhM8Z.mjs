import { i as __toESM } from "../_runtime.mjs";
import { B as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { S as CircleCheck, u as Play, x as CircleX } from "../_libs/lucide-react.mjs";
import { O as Button, f as submitScore, k as cn, r as Route$1, u as getHighScore, w as useUiStore, y as getQuizPool } from "./router-D1ip8uWF.mjs";
import { a as unlockSfx, i as sfx, n as GameChrome, r as HudStat, t as ArticlePicker } from "./sfx-DnkSDGqY.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/games.time-CyaRhM8Z.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var START_TIME = 60;
function TimeAttack({ initialId }) {
	const [articleId, setArticleId] = (0, import_react.useState)(initialId ?? "all");
	const pool = (0, import_react.useMemo)(() => getQuizPool(articleId), [articleId]);
	const tutorOpen = useUiStore((s) => s.tutorOpen);
	const [phase, setPhase] = (0, import_react.useState)("ready");
	const [index, setIndex] = (0, import_react.useState)(0);
	const [timeLeft, setTimeLeft] = (0, import_react.useState)(START_TIME);
	const [score, setScore] = (0, import_react.useState)(0);
	const [combo, setCombo] = (0, import_react.useState)(0);
	const [correct, setCorrect] = (0, import_react.useState)(0);
	const [picked, setPicked] = (0, import_react.useState)(null);
	const [high, setHigh] = (0, import_react.useState)(0);
	const [pop, setPop] = (0, import_react.useState)(null);
	const remainRef = (0, import_react.useRef)(START_TIME);
	const endedRef = (0, import_react.useRef)(false);
	const pausedRef = (0, import_react.useRef)(false);
	pausedRef.current = tutorOpen || picked !== null || phase !== "play";
	const question = pool[index % Math.max(pool.length, 1)];
	(0, import_react.useEffect)(() => {
		setHigh(getHighScore("time"));
	}, []);
	(0, import_react.useEffect)(() => {
		if (phase !== "play") return;
		let raf = 0;
		let last = performance.now();
		const tick = (now) => {
			raf = requestAnimationFrame(tick);
			const dt = Math.min(.1, (now - last) / 1e3);
			last = now;
			if (pausedRef.current) return;
			remainRef.current -= dt;
			if (remainRef.current <= 0) {
				remainRef.current = 0;
				setTimeLeft(0);
				if (!endedRef.current) finish();
				return;
			}
			setTimeLeft(remainRef.current);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [phase]);
	const scoreRef = (0, import_react.useRef)(score);
	const correctRef = (0, import_react.useRef)(correct);
	scoreRef.current = score;
	correctRef.current = correct;
	function finish(finalScore = scoreRef.current) {
		if (endedRef.current) return;
		endedRef.current = true;
		setPhase("over");
		const result = submitScore("time", finalScore);
		setHigh(result.high);
		sfx.win();
	}
	function start() {
		unlockSfx();
		endedRef.current = false;
		remainRef.current = START_TIME;
		setTimeLeft(START_TIME);
		setScore(0);
		setCombo(0);
		setCorrect(0);
		setIndex(0);
		setPicked(null);
		setPop(null);
		setPhase("play");
	}
	function choose(i) {
		if (picked !== null || phase !== "play") return;
		const ok = i === question.a;
		setPicked(i);
		if (ok) {
			const nextCombo = combo + 1;
			const gain = 100 + Math.min(nextCombo, 10) * 20;
			setCombo(nextCombo);
			setScore((n) => n + gain);
			setCorrect((n) => n + 1);
			remainRef.current = Math.min(90, remainRef.current + 3);
			setPop(`+3 秒 · +${gain}`);
			if (nextCombo >= 3) sfx.combo();
			else sfx.ok();
		} else {
			setCombo(0);
			remainRef.current = Math.max(.2, remainRef.current - 5);
			setPop("-5 秒");
			sfx.bad();
		}
		window.setTimeout(() => {
			if (remainRef.current <= 0) {
				finish();
				return;
			}
			setPicked(null);
			setPop(null);
			setIndex((n) => n + 1);
		}, 620);
	}
	const danger = timeLeft < 8;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GameChrome, {
		title: "限時生存戰",
		kicker: "瘋狂刷題",
		blurb: "六十秒開始。答對加三秒並累積連擊；答錯扣五秒、連擊歸零。時間歸零即結算。",
		picker: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArticlePicker, {
			value: articleId,
			onChange: (id) => {
				setArticleId(id);
				setPhase("ready");
			}
		}),
		hud: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-4 gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HudStat, {
					label: "剩餘秒",
					value: timeLeft.toFixed(1),
					warn: danger
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HudStat, {
					label: "分數",
					value: score
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HudStat, {
					label: "連擊",
					value: combo
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HudStat, {
					label: "最高",
					value: high
				})
			]
		}),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-2 overflow-hidden rounded-full bg-paper-deep",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: cn("h-full rounded-full transition-[width,background-color] duration-150", danger ? "bg-seal" : "bg-accent"),
					style: { width: `${Math.max(0, Math.min(100, timeLeft / 90 * 100))}%` }
				})
			}),
			phase === "ready" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl border border-line bg-paper-card p-8 text-center shadow-page",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-serif text-2xl font-bold",
						children: "準備搶秒"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-ink-soft",
						children: [
							"題庫 ",
							pool.length,
							" 題，可混合十二篇或鎖定單篇。"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						className: "mt-6",
						onClick: start,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4" }), " 開始 60 秒"]
					})
				]
			}) : null,
			phase === "over" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl border border-line bg-paper-card p-8 text-center shadow-page",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-serif text-2xl font-bold",
						children: "時間到"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-3xl font-extrabold tabular-nums text-accent",
						children: score
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm text-muted",
						children: [
							"答對 ",
							correct,
							" 題",
							high === score && score > 0 ? " · 新高分" : ` · 最高 ${high}`
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-6",
						onClick: start,
						children: "再戰一局"
					})
				]
			}) : null,
			phase === "play" && question ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "relative space-y-5 rounded-xl border border-line bg-paper-card p-5 shadow-page sm:p-8",
				children: [
					pop ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "combo-pop pointer-events-none absolute right-4 top-4 rounded-full bg-ink px-3 py-1 text-xs font-bold text-paper",
						children: [pop, combo >= 2 ? ` · COMBO ×${combo}` : ""]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs font-bold text-muted",
						children: [
							question.title,
							" · 第 ",
							index + 1,
							" 題"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-serif text-xl font-bold leading-relaxed sm:text-2xl",
						children: question.q
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-1 gap-3",
						children: question.o.map((opt, i) => {
							const revealed = picked !== null;
							const isCorrect = i === question.a;
							const isWrong = revealed && i === picked && !isCorrect;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								disabled: revealed,
								onClick: () => choose(i),
								className: cn("min-h-12 w-full rounded-lg border-2 p-4 text-left text-base font-medium transition-colors", !revealed && "border-line hover:border-accent hover:bg-accent-mist/40", revealed && isCorrect && "border-ok bg-ok/10 font-bold text-ok", isWrong && "border-bad bg-bad/10 text-bad", revealed && !isCorrect && !isWrong && "border-line opacity-55"),
								children: [
									i + 1,
									". ",
									opt
								]
							}, opt);
						})
					}),
					picked !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: cn("flex items-center gap-2 text-sm font-bold", picked === question.a ? "text-ok" : "text-bad"),
						children: picked === question.a ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-4" }), " 正確"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "size-4" }),
							" 正解是選項 ",
							question.a + 1
						] })
					}) : null
				]
			}) : null
		]
	});
}
function TimeRoute() {
	const { id } = Route$1.useSearch();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TimeAttack, { initialId: id });
}
//#endregion
export { TimeRoute as component };
