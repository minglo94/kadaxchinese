import { i as __toESM } from "../_runtime.mjs";
import { B as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as articles, s as getArticle } from "./gemini-BmjONweS.mjs";
import { D as Award, S as CircleCheck, l as RotateCcw, o as Sparkles, x as CircleX } from "../_libs/lucide-react.mjs";
import { E as askGenerateQuiz, O as Button, c as Route$7, k as cn, m as recordQuizAnswer, p as clearAnswers } from "./router-D1ip8uWF.mjs";
import { n as QuizExplain } from "./AiExplain-gBizYDfw.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/quiz-CMRkVaMu.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var AI_CACHE = "dse_ai_quiz_v1";
function readAiCache(id) {
	if (typeof window === "undefined") return null;
	try {
		const raw = localStorage.getItem(AI_CACHE);
		if (!raw) return null;
		return JSON.parse(raw)[id] ?? null;
	} catch {
		return null;
	}
}
function writeAiCache(id, questions) {
	try {
		const raw = localStorage.getItem(AI_CACHE);
		const all = raw ? JSON.parse(raw) : {};
		all[id] = questions;
		localStorage.setItem(AI_CACHE, JSON.stringify(all));
	} catch {}
}
function QuizPage({ initialId }) {
	const [articleId, setArticleId] = (0, import_react.useState)(initialId && getArticle(initialId) ? initialId : articles[0].id);
	const [mode, setMode] = (0, import_react.useState)("flash");
	const article = (0, import_react.useMemo)(() => getArticle(articleId) ?? articles[0], [articleId]);
	(0, import_react.useEffect)(() => {
		if (initialId && getArticle(initialId)) setArticleId(initialId);
	}, [initialId]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-3xl space-y-8 pb-24",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-4 rounded-xl border border-line bg-paper-card/95 p-6 text-center shadow-page",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-serif text-2xl font-bold",
						children: "深度記憶提取箱"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "選擇文章，挑戰閃卡、仿真測驗，或請 AI 按篇章出新題。"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						value: article.id,
						onChange: (event) => setArticleId(event.target.value),
						className: "mx-auto w-full max-w-md rounded-lg border border-line bg-paper-deep p-3 text-center text-sm font-medium outline-none focus:ring-2 focus:ring-accent",
						children: articles.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: item.id,
							children: item.title
						}, item.id))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex border-b border-line",
				children: [
					["flash", `閃卡背誦（${article.f.length}）`],
					["test", `仿真測驗（${article.q.length}）`],
					["ai", "AI 出題"]
				].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setMode(key),
					className: cn("flex-1 py-4 text-sm font-bold", mode === key ? "border-b-2 border-accent text-accent" : "text-muted"),
					children: label
				}, key))
			}),
			mode === "flash" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlashPanel, { cards: article.f }, article.id) : mode === "test" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TestPanel, {
				articleId: article.id,
				title: article.title,
				questions: article.q,
				persist: true
			}, article.id) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AiQuizPanel, {
				articleId: article.id,
				title: article.title
			}, article.id)
		]
	});
}
function FlashPanel({ cards }) {
	const [index, setIndex] = (0, import_react.useState)(0);
	const [flipped, setFlipped] = (0, import_react.useState)(false);
	const card = cards[index];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: () => setFlipped((v) => !v),
			className: "relative flex min-h-[280px] w-full flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-line bg-paper-card p-8 text-center shadow-page transition-colors hover:border-accent",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("mb-6 rounded-full px-3 py-1 text-xs font-bold tracking-widest", flipped ? "bg-seal/12 text-seal" : "bg-paper-deep text-muted"),
					children: flipped ? "答案面" : "問題面"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-serif text-2xl font-bold leading-relaxed text-ink",
					children: flipped ? card.b : card.f
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-8 text-[10px] text-muted",
					children: "點擊卡片翻面"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between px-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "text-sm font-bold tabular-nums text-muted",
				children: [
					index + 1,
					" / ",
					cards.length
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ink",
				onClick: () => {
					setFlipped(false);
					setIndex((i) => (i + 1) % cards.length);
				},
				children: "下一張"
			})]
		})]
	});
}
function TestPanel({ articleId, title, questions, persist }) {
	const [index, setIndex] = (0, import_react.useState)(0);
	const [picked, setPicked] = (0, import_react.useState)(null);
	const [done, setDone] = (0, import_react.useState)(false);
	const question = questions[index];
	const [correctCount, setCorrectCount] = (0, import_react.useState)(0);
	if (!question) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-center text-sm text-muted",
		children: "這篇暫時沒有題目。"
	});
	if (done) {
		const percent = Math.round(correctCount / questions.length * 100);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-xl border border-line bg-paper-card p-8 text-center shadow-page",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto mb-4 inline-flex rounded-full bg-accent-mist p-3 text-accent",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Award, { className: "size-10" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "font-serif text-xl font-bold",
					children: [
						"《",
						title,
						"》測驗結算"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-ink-soft",
					children: percent >= 80 ? "太棒了！完美掌握！" : percent >= 50 ? "表現不錯，繼續保持！" : "要再加油喔！"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto mt-5 max-w-sm rounded-lg border border-line bg-paper-deep p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs font-semibold text-muted",
						children: "本次答對成績"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-1 text-3xl font-extrabold tabular-nums text-accent",
						children: [
							correctCount,
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-base font-normal text-muted",
								children: [
									"/ ",
									questions.length,
									" 題（",
									percent,
									"%）"
								]
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					className: "mt-6",
					onClick: () => {
						if (persist) clearAnswers(articleId);
						setIndex(0);
						setPicked(null);
						setDone(false);
						setCorrectCount(0);
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-4" }), " 再測一次"]
				})
			]
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-8 rounded-xl border border-line bg-paper-card p-6 shadow-page sm:p-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "rounded-md bg-accent-mist px-3 py-1 text-xs font-bold text-accent",
				children: [
					"Q",
					index + 1,
					" / ",
					questions.length
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-serif text-xl font-bold leading-relaxed sm:text-2xl",
				children: question.q
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-1 gap-4",
				children: question.o.map((opt, i) => {
					const revealed = picked !== null;
					const isCorrect = i === question.a;
					const isWrong = revealed && i === picked && !isCorrect;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled: revealed,
						onClick: () => {
							if (picked !== null) return;
							setPicked(i);
							const ok = i === question.a;
							if (ok) setCorrectCount((n) => n + 1);
							if (persist) recordQuizAnswer(articleId, index, ok);
						},
						className: cn("w-full rounded-lg border-2 p-5 text-left text-base font-medium transition-colors", !revealed && "border-line hover:border-accent hover:bg-accent-mist/40", revealed && isCorrect && "border-ok bg-ok/10 font-bold text-ok", isWrong && "border-bad bg-bad/10 text-bad", revealed && !isCorrect && !isWrong && "border-line opacity-60"),
						children: [
							i + 1,
							". ",
							opt
						]
					}, opt);
				})
			}),
			picked !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4 border-t border-line pt-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn("flex items-center gap-2 text-base font-bold", picked === question.a ? "text-ok" : "text-bad"),
						children: picked === question.a ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-6" }), " 完全正確"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "size-6" }),
							" 正確答案是選項 ",
							question.a + 1
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => {
							if (index >= questions.length - 1) {
								setDone(true);
								return;
							}
							setPicked(null);
							setIndex((n) => n + 1);
						},
						children: index >= questions.length - 1 ? "查看成績" : "下一題"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuizExplain, {
					articleTitle: title,
					question: question.q,
					options: question.o,
					correctIndex: question.a,
					pickedIndex: picked
				}, `${articleId}-${index}-${picked}`)]
			}) : null
		]
	});
}
function AiQuizPanel({ articleId, title }) {
	const [questions, setQuestions] = (0, import_react.useState)(() => readAiCache(articleId));
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	async function generate() {
		setBusy(true);
		setError(null);
		try {
			const result = await askGenerateQuiz(articleId);
			if (result.ok) {
				setQuestions(result.questions);
				writeAiCache(articleId, result.questions);
			} else setError(result.error);
		} catch {
			setError("連線失敗，請稍後再試。");
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-xl border border-line bg-paper-card p-5 shadow-page",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm leading-relaxed text-ink-soft",
					children: "按本篇原文、詞解與論點即時出一組新選擇題。題目會暫存在這部裝置，可隨時再練。AI 偶有誤差，請以課文為準。"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					className: "mt-4",
					onClick: () => void generate(),
					disabled: busy,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4" }), busy ? "正在出題…" : questions ? "再出一組新題" : "請 AI 出題"]
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-bad",
					children: error
				}) : null
			]
		}), questions ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TestPanel, {
			articleId,
			title,
			questions
		}, `${articleId}-${questions[0]?.q}`) : null]
	});
}
function QuizRoute() {
	const { id } = Route$7.useSearch();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuizPage, { initialId: id });
}
//#endregion
export { QuizRoute as component };
