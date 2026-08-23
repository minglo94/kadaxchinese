import { i as __toESM } from "../_runtime.mjs";
import { B as require_react, b as require_jsx_runtime, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { s as getArticle } from "./gemini-BmjONweS.mjs";
import { k as ArrowLeft } from "../_libs/lucide-react.mjs";
import { k as cn, n as Route } from "./router-D1ip8uWF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/read._id-DZKDA7IX.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ReadingPage({ article }) {
	const [notes, setNotes] = (0, import_react.useState)(true);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6 pb-24",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/",
				className: "inline-flex items-center gap-2 text-sm text-muted hover:text-accent",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), " 返回總覽"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "border-b border-line pb-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-serif text-3xl font-extrabold text-ink",
					children: article.title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-sm font-medium text-muted",
					children: [
						"體裁：",
						article.cat,
						" ｜ 作者：",
						article.author
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 gap-8 lg:grid-cols-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "rounded-xl border border-line bg-paper-card/95 p-6 shadow-page md:p-8 lg:col-span-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-serif text-xl font-bold",
							children: "完整原文"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex rounded-md bg-paper-deep p-1 text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setNotes(true),
								className: cn("rounded-[8px] px-3 py-1.5 font-medium", notes ? "bg-accent text-accent-fg" : "text-ink-soft"),
								children: "顯示註釋"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setNotes(false),
								className: cn("rounded-[8px] px-3 py-1.5 font-medium", !notes ? "bg-accent text-accent-fg" : "text-ink-soft"),
								children: "隱藏註釋"
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-6",
						children: article.p.map((para, index) => {
							const show = notes && para.h;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2 border-b border-dashed border-line pb-5 last:border-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: cn("classic-text rounded-lg p-3 text-lg", show && "bg-accent-mist/60"),
									children: para.t
								}), show ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "ml-3 rounded-lg border-l-4 border-accent bg-paper-deep p-3 font-sans text-sm leading-relaxed text-ink-soft",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
										className: "text-accent",
										children: "段落點評："
									}), para.h]
								}) : null]
							}, index);
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "space-y-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "rounded-xl border border-line bg-paper-card/95 p-6 shadow-page",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "mb-4 border-b border-line pb-2 font-serif text-lg font-bold text-accent",
								children: "必考詞解"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "space-y-3",
								children: article.v.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col rounded-lg border border-line bg-paper-deep/50 p-3 text-sm sm:flex-row sm:items-center sm:justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mb-1 w-24 shrink-0 font-bold text-accent sm:mb-0",
										children: item.w
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "flex-1 text-ink-soft",
										children: item.m
									})]
								}, item.w))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "rounded-xl border border-seal/25 bg-seal/5 p-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "mb-4 border-b border-seal/20 pb-2 font-serif text-lg font-bold text-seal",
								children: "核心論點"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-soft",
								children: article.c.map((arg) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: arg }, arg))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/quiz",
									search: { id: article.id },
									className: "inline-flex h-11 items-center justify-center rounded-md bg-accent px-4 text-sm font-medium text-accent-fg",
									children: "練習此篇測驗"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/dictation",
									search: { id: article.id },
									className: "inline-flex h-11 items-center justify-center rounded-md border border-line px-4 text-sm font-medium text-ink hover:bg-paper-deep",
									children: "默此篇名句"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/games/snake",
									search: { id: article.id },
									className: "inline-flex h-11 items-center justify-center rounded-md border border-line px-4 text-sm font-medium text-ink hover:bg-paper-deep",
									children: "用此篇玩貪食蛇"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/games/sort",
									search: { id: article.id },
									className: "inline-flex h-11 items-center justify-center rounded-md border border-line px-4 text-sm font-medium text-ink hover:bg-paper-deep",
									children: "重組此篇課文"
								})
							]
						})
					]
				})]
			})
		]
	});
}
function ReadRoute() {
	const { id } = Route.useParams();
	const article = getArticle(id);
	if (!article) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "py-20 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-serif text-xl",
			children: "找不到這篇範文。"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/",
			className: "mt-4 inline-block text-accent",
			children: "返回總覽"
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReadingPage, { article });
}
//#endregion
export { ReadRoute as component };
