import { i as __toESM } from "../_runtime.mjs";
import { B as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as articles, s as getArticle } from "./gemini-BmjONweS.mjs";
import { C as Check, O as ArrowRight, S as CircleCheck, x as CircleX } from "../_libs/lucide-react.mjs";
import { O as Button, S as parseBlanks, h as saveDictationResult, k as cn, l as Route$9 } from "./router-D1ip8uWF.mjs";
import { t as DictationGrade } from "./AiExplain-gBizYDfw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dictation-DI2n8_rn.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function blankCount(text) {
	return (text.match(/\{[^}]+\}/g) ?? []).length;
}
function DictationPage({ initialId }) {
	const startId = initialId && getArticle(initialId) ? initialId : articles[0].id;
	const [articleId, setArticleId] = (0, import_react.useState)(startId);
	const article = (0, import_react.useMemo)(() => getArticle(articleId) ?? articles[0], [articleId]);
	const list = article.dictation;
	const [index, setIndex] = (0, import_react.useState)(0);
	const [checked, setChecked] = (0, import_react.useState)(false);
	const [values, setValues] = (0, import_react.useState)(() => Array.from({ length: blankCount(list[0]?.text ?? "") }, () => ""));
	const [correctCount, setCorrectCount] = (0, import_react.useState)(0);
	const [finished, setFinished] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (initialId && getArticle(initialId)) {
			setArticleId(initialId);
			setCorrectCount(0);
			setIndex(0);
			setChecked(false);
			setFinished(false);
			const next = getArticle(initialId)?.dictation[0]?.text ?? "";
			setValues(Array.from({ length: blankCount(next) }, () => ""));
		}
	}, [initialId]);
	const current = list[index];
	const parsed = (0, import_react.useMemo)(() => parseBlanks(current?.text ?? ""), [current]);
	const blanks = parsed.filter((part) => part.type === "blank");
	const exact = blanks.every((blank) => (values[blank.index] ?? "").trim() === blank.answer);
	function resetFor(nextIndex, nextId = articleId) {
		const next = (getArticle(nextId) ?? article).dictation[nextIndex];
		setIndex(nextIndex);
		setChecked(false);
		setValues(Array.from({ length: blankCount(next?.text ?? "") }, () => ""));
		setFinished(false);
	}
	function switchArticle(id) {
		setArticleId(id);
		setCorrectCount(0);
		resetFor(0, id);
	}
	function check() {
		if (exact) setCorrectCount((n) => n + 1);
		setChecked(true);
	}
	function next() {
		if (index < list.length - 1) {
			resetFor(index + 1);
			return;
		}
		saveDictationResult(article.id, correctCount, list.length);
		setFinished(true);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-3xl space-y-6 pb-24",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "flex flex-col justify-between gap-4 rounded-xl border border-line bg-paper-card/95 p-6 shadow-page sm:flex-row sm:items-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-serif text-xl font-bold",
				children: "範文名句默書"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-muted",
				children: "在空格內填入正確的文言文字詞；寫錯可請 AI 彈性評分"
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
				value: article.id,
				onChange: (event) => switchArticle(event.target.value),
				className: "rounded-lg border border-line bg-paper-deep px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-accent",
				children: articles.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
					value: item.id,
					children: item.title
				}, item.id))
			})]
		}), finished ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-xl border border-line bg-paper-card p-8 text-center shadow-page",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "font-serif text-xl font-bold",
					children: [
						"《",
						article.title,
						"》默書完成"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-3xl font-extrabold tabular-nums text-accent",
					children: [
						correctCount,
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-base font-normal text-muted",
							children: [
								"/ ",
								list.length,
								" 題"
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "mt-6",
					onClick: () => {
						setCorrectCount(0);
						resetFor(0);
					},
					children: "再默一次"
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "space-y-6 rounded-xl border border-line bg-paper-card/95 p-6 shadow-page sm:p-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between border-b border-line pb-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "rounded-full bg-accent-mist px-3 py-1 text-xs font-bold text-accent",
						children: [
							"第 ",
							index + 1,
							" / ",
							list.length,
							" 題"
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-serif text-sm text-muted",
						children: article.title
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "classic-text flex min-h-[100px] flex-wrap items-center gap-2 text-lg sm:text-xl",
					children: parsed.map((part, i) => part.type === "text" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: part.value }, i) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: checked ? (values[part.index] ?? "").trim() === part.answer ? part.answer : `${values[part.index] || "空白"}（正解：${part.answer}）` : values[part.index] ?? "",
						disabled: checked,
						onChange: (event) => {
							const nextVals = [...values];
							nextVals[part.index] = event.target.value;
							setValues(nextVals);
						},
						placeholder: `${part.answer.length} 字`,
						className: cn("min-w-[5rem] border-b-2 bg-transparent px-2 py-1 text-center font-bold outline-none", checked ? (values[part.index] ?? "").trim() === part.answer ? "border-ok text-ok" : "border-bad text-bad" : "border-accent text-accent")
					}, `${index}-${part.index}`))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 border-t border-line pt-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-sm font-medium",
							children: checked ? exact ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-1 text-ok",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-5" }), " 完全默對"]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-1 text-bad",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "size-5" }), " 請對照正確解答"]
							}) : null
						}), checked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "ink",
							onClick: next,
							children: [
								index >= list.length - 1 ? "完成" : "下一題",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							onClick: check,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }), " 檢查答案"]
						})]
					}), checked && !exact ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DictationGrade, {
						articleTitle: article.title,
						sentence: current.text.replace(/[{}]/g, ""),
						expected: blanks.map((blank) => blank.answer),
						given: blanks.map((blank) => values[blank.index] ?? "")
					}, `${article.id}-${index}`) : null]
				})
			]
		})]
	});
}
function DictationRoute() {
	const { id } = Route$9.useSearch();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DictationPage, { initialId: id });
}
//#endregion
export { DictationRoute as component };
