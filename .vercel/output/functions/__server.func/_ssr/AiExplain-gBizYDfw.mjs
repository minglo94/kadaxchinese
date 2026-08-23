import { i as __toESM } from "../_runtime.mjs";
import { B as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as Sparkles } from "../_libs/lucide-react.mjs";
import { D as askGrade, O as Button, T as askExplain } from "./router-D1ip8uWF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/AiExplain-gBizYDfw.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function QuizExplain({ articleTitle, question, options, correctIndex, pickedIndex }) {
	const [text, setText] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	async function run() {
		setBusy(true);
		setError(null);
		try {
			const result = await askExplain({
				articleTitle,
				question,
				options,
				correctIndex,
				pickedIndex
			});
			if (result.ok) setText(result.text);
			else setError(result.error);
		} catch {
			setError("連線失敗，請稍後再試。");
		} finally {
			setBusy(false);
		}
	}
	if (text) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-line bg-paper-deep p-4 text-sm leading-relaxed text-ink-soft whitespace-pre-wrap",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-1 text-xs font-bold tracking-wide text-accent",
			children: "AI 解析"
		}), text]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant: "outline",
			size: "sm",
			onClick: () => void run(),
			disabled: busy,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4" }), busy ? "解析中…" : "請 AI 解析"]
		}), error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-bad",
			children: error
		}) : null]
	});
}
function DictationGrade({ articleTitle, sentence, expected, given }) {
	const [text, setText] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	async function run() {
		setBusy(true);
		setError(null);
		try {
			const result = await askGrade({
				articleTitle,
				sentence,
				expected,
				given
			});
			if (result.ok) setText(result.text);
			else setError(result.error);
		} catch {
			setError("連線失敗，請稍後再試。");
		} finally {
			setBusy(false);
		}
	}
	if (text) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-line bg-paper-deep p-4 text-sm leading-relaxed text-ink-soft whitespace-pre-wrap",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-1 text-xs font-bold tracking-wide text-accent",
			children: "AI 彈性評分"
		}), text]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant: "outline",
			size: "sm",
			onClick: () => void run(),
			disabled: busy,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4" }), busy ? "評閱中…" : "請 AI 彈性評分"]
		}), error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-bad",
			children: error
		}) : null]
	});
}
//#endregion
export { QuizExplain as n, DictationGrade as t };
