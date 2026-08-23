import { i as __toESM } from "../_runtime.mjs";
import { B as require_react, b as require_jsx_runtime, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { A as Apple, O as ArrowRight, d as PenLine, h as Layers, i as Timer, m as ListOrdered } from "../_libs/lucide-react.mjs";
import { d as loadScores, g as GAME_META } from "./router-D1ip8uWF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/games.index-BqK-Dh3T.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var ICONS = {
	snake: Apple,
	time: Timer,
	match: Layers,
	sort: ListOrdered,
	hangman: PenLine
};
function GamesHub() {
	const [scores, setScores] = (0, import_react.useState)({
		snake: 0,
		time: 0,
		match: 0,
		sort: 0,
		hangman: 0
	});
	(0, import_react.useEffect)(() => {
		setScores(loadScores());
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-8 pb-24",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "relative overflow-hidden rounded-xl border border-line bg-paper-card/90 p-7 shadow-page sm:p-10",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-bold tracking-[0.28em] text-accent",
					children: "趣味闖關"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-3 font-serif text-3xl font-extrabold leading-tight text-ink sm:text-4xl",
					children: "把範文變成一場局"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base",
					children: "五種節奏不同的練習：刷詞義、搶秒數、翻牌、重組課文、名句填空。分數存在這部裝置，可隨時再破。"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-1 gap-5 md:grid-cols-2",
			children: GAME_META.map((game) => {
				const Icon = ICONS[game.id];
				const high = scores[game.id] ?? 0;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: game.to,
					className: "group flex min-h-[200px] flex-col justify-between rounded-xl border border-line bg-paper-card/95 p-6 shadow-page transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-accent",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex items-center gap-2 rounded-full bg-paper-deep px-3 py-1 text-[11px] font-bold tracking-wide text-muted",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-3.5" }), game.kicker]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs font-bold tabular-nums text-accent",
								children: ["最高 ", high]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-4 font-serif text-2xl font-bold leading-snug text-ink group-hover:text-accent",
							children: game.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm leading-relaxed text-ink-soft",
							children: game.blurb
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 flex items-center justify-between border-t border-line pt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm text-muted",
							children: "開始這一局"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-5 text-line transition-colors group-hover:text-accent" })]
					})]
				}, game.id);
			})
		})]
	});
}
var SplitComponent = GamesHub;
//#endregion
export { SplitComponent as component };
