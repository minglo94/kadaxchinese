import { i as __toESM } from "../_runtime.mjs";
import { B as require_react, b as require_jsx_runtime, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as articles, r as categories } from "./gemini-BmjONweS.mjs";
import { A as Apple, O as ArrowRight, d as PenLine, h as Layers, i as Timer, m as ListOrdered, o as Sparkles } from "../_libs/lucide-react.mjs";
import { g as GAME_META, k as cn } from "./router-D1ip8uWF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DkB4kY8c.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var ICONS = {
	snake: Apple,
	time: Timer,
	match: Layers,
	sort: ListOrdered,
	hangman: PenLine
};
function HomePage() {
	const [cat, setCat] = (0, import_react.useState)("全部");
	const list = (0, import_react.useMemo)(() => cat === "全部" ? articles : articles.filter((item) => item.cat === cat), [cat]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-8 pb-24",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "relative overflow-hidden rounded-xl border border-line bg-paper-card/90 p-7 shadow-page sm:p-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-bold tracking-[0.28em] text-accent",
						children: "HKDSE 中文科指定範文"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
						className: "mt-3 font-serif text-3xl font-extrabold leading-tight text-ink sm:text-5xl",
						children: ["十二篇範文", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-2 block text-2xl font-bold text-accent sm:text-3xl",
							children: "宣紙上的溫習書齋"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base",
						children: "完整原文、必考詞解、閃卡與仿真測驗、名句默書。現加趣味闖關與 AI 助教：吃錯詞義會扣心，答錯選擇題可即時解析。"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 flex flex-wrap gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/games",
							className: "inline-flex h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-fg",
							children: "進入趣味闖關"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/quiz",
							className: "inline-flex h-11 items-center rounded-md border border-line px-4 text-sm font-medium text-ink hover:bg-paper-deep",
							children: "先做測驗"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-end justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-serif text-xl font-bold",
						children: "五種闖關"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/games",
						className: "text-sm font-medium text-accent hover:underline",
						children: "看全部"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5",
					children: GAME_META.map((game) => {
						const Icon = ICONS[game.id];
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: game.to,
							className: "rounded-xl border border-line bg-paper-card/95 p-4 shadow-page transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-accent",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4 text-accent" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 font-serif text-base font-bold",
									children: game.title
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs leading-relaxed text-muted",
									children: game.kicker
								})
							]
						}, game.id);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "flex items-start gap-3 rounded-xl border border-line bg-paper-card/90 p-5 shadow-page",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "mt-0.5 size-5 shrink-0 text-accent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-serif text-lg font-bold",
					children: "AI 書齋助教"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm leading-relaxed text-ink-soft",
					children: "右下角隨時提問語譯與手法。公開網站請在助教齒輪圖示貼上免費 Gemini API 金鑰；測驗答錯可生成解析，默書可彈性評分，亦可按篇章出新題。"
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2",
				children: categories.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setCat(item),
					className: cn("h-10 rounded-full px-4 text-sm font-medium transition-colors duration-150", cat === item ? "bg-ink text-paper" : "border border-line bg-paper-card text-ink-soft hover:text-ink"),
					children: item
				}, item))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3",
				children: list.map((article) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/read/$id",
					params: { id: article.id },
					className: "group flex min-h-[200px] flex-col justify-between rounded-xl border border-line bg-paper-card/95 p-6 shadow-page transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-accent",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "inline-block rounded-full bg-paper-deep px-3 py-1 text-[11px] font-bold tracking-wide text-muted",
						children: article.cat
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-4 font-serif text-2xl font-bold leading-snug text-ink group-hover:text-accent",
						children: article.title
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 flex items-center justify-between border-t border-line pt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted",
							children: ["作者：", article.author]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-5 text-line transition-colors group-hover:text-accent" })]
					})]
				}, article.id))
			})
		]
	});
}
var SplitComponent = HomePage;
//#endregion
export { SplitComponent as component };
