import { i as __toESM } from "../_runtime.mjs";
import { B as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { u as Play } from "../_libs/lucide-react.mjs";
import { C as shuffle, O as Button, f as submitScore, k as cn, o as Route$4, u as getHighScore, v as getFlashPairs } from "./router-D1ip8uWF.mjs";
import { a as unlockSfx, i as sfx, n as GameChrome, r as HudStat, t as ArticlePicker } from "./sfx-DnkSDGqY.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/games.match-BOzJfjp7.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function deal(articleId) {
	const pairs = getFlashPairs(articleId).slice(0, 8);
	const cards = [];
	pairs.forEach((item, i) => {
		const pair = `${item.articleId}-${i}-${item.front}`;
		cards.push({
			id: `${pair}-w`,
			pair,
			text: item.front,
			kind: "word"
		});
		cards.push({
			id: `${pair}-m`,
			pair,
			text: item.back,
			kind: "meaning"
		});
	});
	return shuffle(cards);
}
function MemoryMatch({ initialId }) {
	const [articleId, setArticleId] = (0, import_react.useState)(initialId ?? "all");
	const [phase, setPhase] = (0, import_react.useState)("ready");
	const [cards, setCards] = (0, import_react.useState)([]);
	const [flipped, setFlipped] = (0, import_react.useState)([]);
	const [matched, setMatched] = (0, import_react.useState)([]);
	const [lock, setLock] = (0, import_react.useState)(false);
	const [moves, setMoves] = (0, import_react.useState)(0);
	const [elapsed, setElapsed] = (0, import_react.useState)(0);
	const [high, setHigh] = (0, import_react.useState)(0);
	const remaining = (0, import_react.useMemo)(() => cards.filter((card) => !matched.includes(card.pair)).length / 2, [cards, matched]);
	(0, import_react.useEffect)(() => {
		setHigh(getHighScore("match"));
	}, []);
	(0, import_react.useEffect)(() => {
		if (phase !== "play") return;
		const t = window.setInterval(() => setElapsed((n) => n + 1), 1e3);
		return () => window.clearInterval(t);
	}, [phase]);
	function start() {
		unlockSfx();
		setCards(deal(articleId));
		setFlipped([]);
		setMatched([]);
		setLock(false);
		setMoves(0);
		setElapsed(0);
		setPhase("play");
	}
	function flip(card) {
		if (phase !== "play" || lock) return;
		if (matched.includes(card.pair) || flipped.includes(card.id)) return;
		sfx.flip();
		const next = [...flipped, card.id];
		setFlipped(next);
		if (next.length < 2) return;
		setMoves((n) => n + 1);
		const [aId, bId] = next;
		const a = cards.find((item) => item.id === aId);
		const b = cards.find((item) => item.id === bId);
		if (!a || !b) return;
		if (a.pair === b.pair && a.id !== b.id) {
			sfx.ok();
			const nextMatched = [...matched, a.pair];
			setMatched(nextMatched);
			setFlipped([]);
			if (nextMatched.length === cards.length / 2) {
				const score = Math.max(50, 800 - (moves + 1) * 12 - elapsed * 4);
				const result = submitScore("match", score);
				setHigh(result.high);
				setPhase("over");
				sfx.win();
			}
		} else {
			setLock(true);
			sfx.bad();
			window.setTimeout(() => {
				setFlipped([]);
				setLock(false);
			}, 700);
		}
	}
	const scoreNow = Math.max(50, 800 - moves * 12 - elapsed * 4);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GameChrome, {
		title: "字義翻牌",
		kicker: "配對記憶",
		blurb: "一組文言重點字、一組白話語譯。一次翻兩張，配對正確即消去。步數與時間都會影響分數。",
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
					label: "步數",
					value: moves
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HudStat, {
					label: "剩餘對",
					value: remaining
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HudStat, {
					label: "秒數",
					value: elapsed
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
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-serif text-2xl font-bold",
						children: "八對詞義"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-ink-soft",
						children: "記住位置，配對字詞與解釋。"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						className: "mt-6",
						onClick: start,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4" }), " 開始翻牌"]
					})
				]
			}) : null,
			phase === "over" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl border border-line bg-paper-card p-8 text-center shadow-page",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-serif text-2xl font-bold",
						children: "全部配對"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-3xl font-extrabold tabular-nums text-accent",
						children: scoreNow
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm text-muted",
						children: [
							moves,
							" 步 · ",
							elapsed,
							" 秒"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-6",
						onClick: start,
						children: "再配一局"
					})
				]
			}) : null,
			phase === "play" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-2 gap-2 sm:grid-cols-4",
				children: cards.map((card) => {
					const open = flipped.includes(card.id) || matched.includes(card.pair);
					const done = matched.includes(card.pair);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: open || lock,
						onClick: () => flip(card),
						className: cn("relative min-h-[92px] rounded-lg border-2 p-3 text-center transition-[transform,background-color,border-color] duration-200", done && "border-ok/40 bg-ok/10", open && !done && "border-accent bg-paper-card", !open && "border-line bg-accent text-accent-fg hover:bg-accent-deep"),
						children: open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cn("block font-medium leading-snug", card.kind === "word" ? "font-serif text-lg font-bold text-accent" : "text-sm text-ink-soft"),
							children: card.text
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-serif text-lg font-bold",
							children: "文"
						})
					}, card.id);
				})
			}) : null
		]
	});
}
function MatchRoute() {
	const { id } = Route$4.useSearch();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MemoryMatch, { initialId: id });
}
//#endregion
export { MatchRoute as component };
