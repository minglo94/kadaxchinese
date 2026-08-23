import { i as __toESM } from "../_runtime.mjs";
import { B as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { _ as Heart, u as Play } from "../_libs/lucide-react.mjs";
import { O as Button, S as parseBlanks, _ as getBlankPuzzles, f as submitScore, k as cn, s as Route$5, u as getHighScore } from "./router-D1ip8uWF.mjs";
import { a as unlockSfx, i as sfx, n as GameChrome, r as HudStat, t as ArticlePicker } from "./sfx-DnkSDGqY.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/games.hangman-EKDXGPGt.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function HangmanGame({ initialId }) {
	const [articleId, setArticleId] = (0, import_react.useState)(initialId ?? "all");
	const puzzles = (0, import_react.useMemo)(() => getBlankPuzzles(articleId), [articleId]);
	const [phase, setPhase] = (0, import_react.useState)("ready");
	const [index, setIndex] = (0, import_react.useState)(0);
	const [values, setValues] = (0, import_react.useState)([]);
	const [lives, setLives] = (0, import_react.useState)(3);
	const [score, setScore] = (0, import_react.useState)(0);
	const [solved, setSolved] = (0, import_react.useState)(0);
	const [checked, setChecked] = (0, import_react.useState)(false);
	const [ok, setOk] = (0, import_react.useState)(false);
	const [shake, setShake] = (0, import_react.useState)(false);
	const [high, setHigh] = (0, import_react.useState)(0);
	const scoreRef = (0, import_react.useRef)(0);
	const puzzle = puzzles[index];
	const parsed = (0, import_react.useMemo)(() => parseBlanks(puzzle?.text ?? ""), [puzzle]);
	const blanks = parsed.filter((part) => part.type === "blank");
	(0, import_react.useEffect)(() => {
		setHigh(getHighScore("hangman"));
	}, []);
	function load(i, keepLives = true) {
		const item = puzzles[i];
		if (!item) return;
		const parts = parseBlanks(item.text);
		setIndex(i);
		setValues(Array.from({ length: parts.filter((p) => p.type === "blank").length }, () => ""));
		setChecked(false);
		setOk(false);
		if (!keepLives) setLives(3);
	}
	function start() {
		unlockSfx();
		scoreRef.current = 0;
		setScore(0);
		setSolved(0);
		setLives(3);
		setPhase("play");
		load(0, false);
	}
	function submit() {
		if (!puzzle || checked) return;
		if (blanks.every((blank) => (values[blank.index] ?? "").trim() === blank.answer)) {
			setChecked(true);
			setOk(true);
			const gain = 80 + lives * 20;
			scoreRef.current += gain;
			setScore(scoreRef.current);
			setSolved((n) => n + 1);
			sfx.ok();
			return;
		}
		const nextLives = lives - 1;
		setLives(nextLives);
		setShake(true);
		sfx.bad();
		window.setTimeout(() => setShake(false), 450);
		if (nextLives <= 0) {
			setChecked(true);
			setOk(false);
			setPhase("over");
			const result = submitScore("hangman", scoreRef.current);
			setHigh(result.high);
		}
	}
	function next() {
		if (index >= puzzles.length - 1) {
			setPhase("over");
			const result = submitScore("hangman", scoreRef.current);
			setHigh(result.high);
			sfx.win();
			return;
		}
		load(index + 1);
	}
	const hp = lives / 3 * 100;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GameChrome, {
		title: "名句填字謎",
		kicker: "三命解謎",
		blurb: "語譯作提示，在空格填入原文。全對才過關；寫錯一次扣一格血，三條命用盡即結束。",
		picker: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArticlePicker, {
			value: articleId,
			onChange: (id) => {
				setArticleId(id);
				setPhase("ready");
			}
		}),
		hud: phase === "ready" ? void 0 : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-4 gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HudStat, {
					label: "分數",
					value: score
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HudStat, {
					label: "過關",
					value: solved
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HudStat, {
					label: "最高",
					value: high
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-lg border border-line bg-paper-deep/80 px-3 py-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[11px] font-semibold tracking-wide text-muted",
						children: "血量"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 flex gap-1",
						children: Array.from({ length: 3 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: cn("size-5", i < lives ? "fill-seal text-seal" : "text-line") }, i))
					})]
				})
			]
		}),
		children: [
			phase !== "ready" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-3 overflow-hidden rounded-full bg-paper-deep",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: cn("h-full rounded-full transition-[width] duration-300", lives === 1 ? "bg-seal" : "bg-accent"),
					style: { width: `${hp}%` }
				})
			}) : null,
			phase === "ready" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl border border-line bg-paper-card p-8 text-center shadow-page",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-serif text-2xl font-bold",
						children: "三條命，解名句"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-ink-soft",
						children: [
							"題庫 ",
							puzzles.length,
							" 句，寫錯會扣血但不立即公布答案。"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						className: "mt-6",
						onClick: start,
						disabled: puzzles.length === 0,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4" }), " 開始解謎"]
					})
				]
			}) : null,
			phase === "over" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl border border-line bg-paper-card p-8 text-center shadow-page",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-serif text-2xl font-bold",
						children: lives <= 0 ? "墨盡了" : "全部解開"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-3xl font-extrabold tabular-nums text-accent",
						children: score
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm text-muted",
						children: [
							"解開 ",
							solved,
							" 句"
						]
					}),
					puzzle && lives <= 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-4 font-serif text-sm text-ink-soft",
						children: ["正解：", puzzle.text.replace(/[{}]/g, "")]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-6",
						onClick: start,
						children: "再解一局"
					})
				]
			}) : null,
			phase === "play" && puzzle ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: cn("space-y-5 rounded-xl border border-line bg-paper-card p-5 shadow-page sm:p-7", shake && "error-shake"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-center justify-between gap-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "rounded-full bg-accent-mist px-3 py-1 text-xs font-bold text-accent",
							children: [
								puzzle.title,
								" · ",
								index + 1,
								"/",
								puzzles.length
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "rounded-lg border-l-4 border-accent bg-paper-deep p-3 text-sm leading-relaxed text-ink-soft",
						children: ["語譯提示：", puzzle.hint]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "classic-text flex min-h-[88px] flex-wrap items-center gap-2 text-lg sm:text-xl",
						children: parsed.map((part, i) => part.type === "text" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: part.value }, i) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: checked && ok ? part.answer : values[part.index] ?? "",
							disabled: checked && ok,
							onChange: (event) => {
								const next = [...values];
								next[part.index] = event.target.value;
								setValues(next);
							},
							placeholder: `${part.answer.length} 字`,
							className: "min-w-[5.5rem] border-b-2 border-accent bg-transparent px-2 py-1 text-center font-bold text-accent outline-none"
						}, `${puzzle.id}-${part.index}`))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-center justify-end gap-2 border-t border-line pt-4",
						children: checked && ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: next,
							children: index >= puzzles.length - 1 ? "完成" : "下一句"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: submit,
							children: "核對"
						})
					})
				]
			}) : null
		]
	});
}
function HangmanRoute() {
	const { id } = Route$5.useSearch();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HangmanGame, { initialId: id });
}
//#endregion
export { HangmanRoute as component };
