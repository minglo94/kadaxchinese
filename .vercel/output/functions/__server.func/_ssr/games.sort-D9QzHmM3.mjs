import { i as __toESM } from "../_runtime.mjs";
import { B as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as Check, l as RotateCcw, u as Play, v as GripVertical } from "../_libs/lucide-react.mjs";
import { C as shuffle, O as Button, b as getSortPuzzles, f as submitScore, i as Route$2, k as cn, u as getHighScore } from "./router-D1ip8uWF.mjs";
import { a as unlockSfx, i as sfx, n as GameChrome, r as HudStat, t as ArticlePicker } from "./sfx-DnkSDGqY.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/games.sort-D9QzHmM3.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function scramble(chunks) {
	let next = shuffle(chunks);
	let guard = 0;
	while (next.join("|") === chunks.join("|") && chunks.length > 1 && guard < 8) {
		next = shuffle(chunks);
		guard += 1;
	}
	return next;
}
function SentenceSort({ initialId }) {
	const [articleId, setArticleId] = (0, import_react.useState)(initialId ?? "all");
	const puzzles = (0, import_react.useMemo)(() => getSortPuzzles(articleId), [articleId]);
	const [phase, setPhase] = (0, import_react.useState)("ready");
	const [index, setIndex] = (0, import_react.useState)(0);
	const [order, setOrder] = (0, import_react.useState)([]);
	const [checked, setChecked] = (0, import_react.useState)(false);
	const [ok, setOk] = (0, import_react.useState)(false);
	const [score, setScore] = (0, import_react.useState)(0);
	const [solved, setSolved] = (0, import_react.useState)(0);
	const [high, setHigh] = (0, import_react.useState)(0);
	const [dragFrom, setDragFrom] = (0, import_react.useState)(null);
	const scoreRef = (0, import_react.useRef)(0);
	const puzzle = puzzles[index];
	(0, import_react.useEffect)(() => {
		setHigh(getHighScore("sort"));
	}, []);
	function load(i) {
		const item = puzzles[i];
		if (!item) return;
		setIndex(i);
		setOrder(scramble(item.chunks));
		setChecked(false);
		setOk(false);
	}
	function start() {
		unlockSfx();
		scoreRef.current = 0;
		setScore(0);
		setSolved(0);
		setPhase("play");
		load(0);
	}
	function move(from, to) {
		if (checked || from === to || from < 0 || to < 0) return;
		setOrder((list) => {
			const next = [...list];
			const [item] = next.splice(from, 1);
			next.splice(to, 0, item);
			return next;
		});
	}
	function check() {
		if (!puzzle) return;
		const match = order.join("|") === puzzle.chunks.join("|");
		setChecked(true);
		setOk(match);
		if (match) {
			const gain = 120 + Math.max(0, 6 - puzzle.chunks.length) * 10;
			scoreRef.current += gain;
			setScore(scoreRef.current);
			setSolved((n) => n + 1);
			sfx.ok();
		} else sfx.bad();
	}
	function next() {
		if (index >= puzzles.length - 1) {
			setPhase("over");
			const result = submitScore("sort", scoreRef.current);
			setHigh(result.high);
			sfx.win();
			return;
		}
		load(index + 1);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GameChrome, {
		title: "課文重組",
		kicker: "脈絡默書",
		blurb: "長段按句子打散。按住左側拖曳，或用上下鍵微調。排回原文順序即過關。",
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
					label: "已解",
					value: `${solved}/${puzzles.length}`
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HudStat, {
					label: "句數",
					value: puzzle?.chunks.length ?? 0
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HudStat, {
					label: "最高",
					value: high
				})
			]
		}),
		children: [
			phase === "ready" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl border border-line bg-paper-card p-8 text-center shadow-page",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-serif text-2xl font-bold",
						children: [
							"重組 ",
							puzzles.length,
							" 段"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-ink-soft",
						children: "建議先從《出師表》《岳陽樓記》《勸學》入手。"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						className: "mt-6",
						onClick: start,
						disabled: puzzles.length === 0,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4" }), " 開始排序"]
					})
				]
			}) : null,
			phase === "over" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl border border-line bg-paper-card p-8 text-center shadow-page",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-serif text-2xl font-bold",
						children: "全部排完"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-3xl font-extrabold tabular-nums text-accent",
						children: score
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-6",
						onClick: start,
						children: "再排一次"
					})
				]
			}) : null,
			phase === "play" && puzzle ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-4 rounded-xl border border-line bg-paper-card p-5 shadow-page sm:p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-serif text-sm font-bold text-accent",
							children: puzzle.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted",
							children: [
								index + 1,
								" / ",
								puzzles.length
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "rounded-lg border-l-4 border-accent bg-paper-deep p-3 text-sm leading-relaxed text-ink-soft",
						children: ["語譯提示：", puzzle.hint]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
						className: "space-y-2",
						children: order.map((chunk, i) => {
							const correctHere = checked && chunk === puzzle.chunks[i];
							const wrongHere = checked && chunk !== puzzle.chunks[i];
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								draggable: !checked,
								onDragStart: () => setDragFrom(i),
								onDragOver: (event) => event.preventDefault(),
								onDrop: () => {
									if (dragFrom !== null) move(dragFrom, i);
									setDragFrom(null);
								},
								className: cn("flex items-stretch gap-2 rounded-lg border-2 bg-paper-deep/60", !checked && "border-line", correctHere && "border-ok bg-ok/10", wrongHere && "border-bad/50 bg-bad/5"),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex w-10 shrink-0 flex-col items-center justify-center gap-1 border-r border-line text-muted",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GripVertical, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[11px] font-bold tabular-nums",
											children: i + 1
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "flex-1 py-3 pr-2 font-serif text-base leading-relaxed",
										children: chunk
									}),
									!checked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-col justify-center gap-1 p-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											"aria-label": "上移",
											disabled: i === 0,
											onClick: () => move(i, i - 1),
											className: "size-8 rounded-md text-xs font-bold text-muted hover:bg-paper-card disabled:opacity-30",
											children: "上"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											"aria-label": "下移",
											disabled: i === order.length - 1,
											onClick: () => move(i, i + 1),
											className: "size-8 rounded-md text-xs font-bold text-muted hover:bg-paper-card disabled:opacity-30",
											children: "下"
										})]
									}) : null
								]
							}, `${chunk}-${i}`);
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4",
						children: [checked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: cn("text-sm font-bold", ok ? "text-ok" : "text-bad"),
							children: ok ? "順序正確" : "尚未還原，對照語譯再調一次。"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted",
							children: "可拖曳或按上／下微調"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [checked && !ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								onClick: () => {
									setChecked(false);
									setOk(false);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-4" }), " 繼續調"]
							}) : null, checked && ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								onClick: next,
								children: index >= puzzles.length - 1 ? "完成" : "下一段"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								onClick: check,
								disabled: checked && ok,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }), " 檢查順序"]
							})]
						})]
					})
				]
			}) : null
		]
	});
}
function SortRoute() {
	const { id } = Route$2.useSearch();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SentenceSort, { initialId: id });
}
//#endregion
export { SortRoute as component };
