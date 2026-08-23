import { i as __toESM } from "../_runtime.mjs";
import { B as require_react, _ as createRootRoute, b as require_jsx_runtime, d as useRouterState, g as createFileRoute, h as lazyRouteComponent, l as Scripts, m as Outlet, p as createRouter, u as HeadContent, v as Link, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as explainMessages, c as gradeMessages, d as sanitizeGeminiKey, f as tutorMessages, i as completeGemini, l as isGeminiAuthKey, n as articles, o as generateQuizMessages, s as getArticle, t as AI_TOKENS, u as parseGeneratedQuiz } from "./gemini-BmjONweS.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { E as BookOpen, S as CircleCheck, T as Bot, a as Sun, b as ExternalLink, c as Send, d as PenLine, g as KeyRound, n as TriangleAlert, p as Moon, r as Trash2, s as Settings2, t as X, w as ChartNoAxesColumn, y as Gamepad2 } from "../_libs/lucide-react.mjs";
import { a as union, i as string, n as number, r as object, t as literal } from "../_libs/zod.mjs";
import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/utils-C_uf36nf.js
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/router-D1ip8uWF.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: error.message || "An unexpected error occurred. Try reloading the page."
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	if (typeof window === "undefined") return () => {};
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	const parentOrigin = resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		if (envelope.data.type === "hello") {
			if (!HelloSchema.safeParse(event.data).success) return;
			announce();
			return;
		}
		if (envelope.data.type === "navigate") {
			const parsed = NavigateSchema.safeParse(event.data);
			if (!parsed.success) return;
			navigate(parsed.data.path);
			queueMicrotask(reportLocation);
			return;
		}
		if (envelope.data.type === "history") {
			const parsed = HistorySchema.safeParse(event.data);
			if (!parsed.success) return;
			if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
			window.history.go(parsed.data.delta);
		}
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 font-medium select-none transition-[transform,background-color,color,opacity,border-color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-45 active:not-disabled:scale-[0.96]", {
	variants: {
		variant: {
			primary: "bg-accent text-accent-fg hover:bg-accent-deep",
			ink: "bg-ink text-paper hover:opacity-90",
			ghost: "text-ink-soft hover:bg-paper-deep hover:text-ink",
			outline: "border border-line bg-transparent text-ink hover:bg-paper-deep",
			seal: "bg-seal text-paper hover:opacity-90"
		},
		size: {
			sm: "h-9 rounded-[10px] px-3 text-sm",
			md: "h-11 rounded-md px-4 text-sm",
			lg: "h-12 rounded-lg px-5 text-base",
			icon: "size-11 rounded-md"
		}
	},
	defaultVariants: {
		variant: "primary",
		size: "md"
	}
});
var Button = (0, import_react.forwardRef)(function Button({ className, variant, size, type = "button", ...props }, ref) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		ref,
		type,
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
});
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var aiStatus = createServerFn({ method: "GET" }).handler(createSsrRpc("a0f232b5ca0187bc9fe40a301ee2940b0a5db3a672463d1e57d3938a935a6d51"));
var pingAi = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("f313621e15afa40d27d6fa1834e943da25b305a1ca5a179312e1d50fd18d763a"));
var explainQuiz = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("75b117e63abc8b4576ce0c9a7e13a47b7e82c2a7d4372a679cf61f8f74b85d2d"));
var gradeDictation = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("9992ca6e632ed08aa35eb4a5c98bb5a8aea582a8fd1b2edb64a5ae9dc3049c67"));
var tutorChat = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("aa1f57deb989cb2243ad631467fdd8027270dc7b122a7790d873db1ae77a2d4c"));
var generateQuiz = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("0c5a06178f3eb2ddaac554a30d244d37cce60e9b6b9ce689aaa01bfd18804e87"));
var STORAGE = "dse_gemini_api_key";
function getGeminiKey() {
	if (typeof window === "undefined") return "";
	try {
		return sanitizeGeminiKey(localStorage.getItem(STORAGE) ?? "");
	} catch {
		return "";
	}
}
function setGeminiKey(key) {
	const trimmed = sanitizeGeminiKey(key);
	if (!trimmed) {
		clearGeminiKey();
		return;
	}
	localStorage.setItem(STORAGE, trimmed);
}
function clearGeminiKey() {
	try {
		localStorage.removeItem(STORAGE);
	} catch {}
}
function withGeminiKey(data) {
	const geminiKey = getGeminiKey();
	return geminiKey ? {
		...data,
		geminiKey
	} : data;
}
function localKey() {
	return getGeminiKey();
}
async function pingAssistant(geminiKey) {
	const key = (geminiKey ?? localKey()).trim();
	if (key) return completeGemini(key, [{
		role: "system",
		content: "只回兩個字：就緒"
	}, {
		role: "user",
		content: "測試連線"
	}], AI_TOKENS.ping);
	return pingAi({ data: {} });
}
async function askTutor(input) {
	const key = localKey();
	if (!key) return tutorChat({ data: withGeminiKey(input) });
	return completeGemini(key, tutorMessages(input.articleId, input.messages), AI_TOKENS.tutor);
}
async function askExplain(input) {
	const key = localKey();
	if (!key) return explainQuiz({ data: withGeminiKey(input) });
	return completeGemini(key, explainMessages(input), AI_TOKENS.explain);
}
async function askGrade(input) {
	const key = localKey();
	if (!key) return gradeDictation({ data: withGeminiKey(input) });
	return completeGemini(key, gradeMessages(input), AI_TOKENS.grade);
}
async function askGenerateQuiz(articleId) {
	const key = localKey();
	if (!key) return generateQuiz({ data: withGeminiKey({ articleId }) });
	const built = generateQuizMessages(articleId);
	if ("error" in built) return {
		ok: false,
		error: built.error
	};
	const result = await completeGemini(key, built, AI_TOKENS.quiz, { json: true });
	if (!result.ok) return result;
	return parseGeneratedQuiz(result.text);
}
function GeminiSetup({ status, onSaved }) {
	const [draft, setDraft] = (0, import_react.useState)("");
	const [saved, setSaved] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [message, setMessage] = (0, import_react.useState)(null);
	const [ok, setOk] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const existing = getGeminiKey();
		setSaved(existing);
		setDraft(existing);
	}, []);
	async function saveAndTest() {
		const key = sanitizeGeminiKey(draft);
		if (!key && !status?.geminiEnv && !status?.xaiEnv) {
			setOk(false);
			setMessage("請先貼上 Gemini API 金鑰。");
			return;
		}
		setBusy(true);
		setMessage(null);
		try {
			if (key) setGeminiKey(key);
			else clearGeminiKey();
			const result = await pingAssistant(key);
			if (result.ok) {
				setSaved(key);
				setOk(true);
				setMessage(!key ? "已使用網站後台金鑰連線。" : isGeminiAuthKey(key) ? "已連接 Gemini（新版 AQ 金鑰）。" : "已連接 Gemini。");
				onSaved();
			} else {
				setOk(false);
				setMessage(result.error);
			}
		} catch {
			setOk(false);
			setMessage("連線失敗，請檢查金鑰後再試。");
		} finally {
			setBusy(false);
		}
	}
	function remove() {
		clearGeminiKey();
		setDraft("");
		setSaved("");
		setOk(false);
		setMessage("已清除本機金鑰。");
		onSaved();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, { className: "mt-0.5 size-4 shrink-0 text-accent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-bold text-ink",
					children: "連接 Gemini 助教"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs leading-relaxed text-muted",
					children: status?.geminiEnv ? "網站已設定 Gemini 3.5，可直接提問。也可另貼自己的金鑰。" : "貼上 Google AI Studio 金鑰後，瀏覽器會直接連 Gemini 3.5 Flash（不再使用已停用的 2.5 / 2.0）。"
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
				className: "list-decimal space-y-1 pl-4 text-xs leading-relaxed text-ink-soft",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
						"開啟",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: "https://aistudio.google.com/apikey",
							target: "_blank",
							rel: "noreferrer",
							className: "inline-flex items-center gap-1 font-medium text-accent hover:underline",
							children: ["Google AI Studio", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-3" })]
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "建立 API key，複製後貼到下方。新金鑰多以 AQ. 開頭，舊金鑰以 AIza 開頭，兩種都支援。" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "按「儲存並測試」。金鑰只留在這部裝置，不會寫進 GitHub。" })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mb-1 block text-xs font-medium text-muted",
					children: "Gemini API 金鑰"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "password",
					autoComplete: "off",
					spellCheck: false,
					value: draft,
					onChange: (event) => setDraft(event.target.value),
					placeholder: "AIza… 或 AQ.…",
					className: "h-11 w-full rounded-md border border-line bg-paper-deep px-3 text-sm outline-none focus:ring-2 focus:ring-accent"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					onClick: () => void saveAndTest(),
					disabled: busy,
					children: busy ? "測試中…" : "儲存並測試"
				}), saved ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					variant: "outline",
					onClick: remove,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" }), "清除"]
				}) : null]
			}),
			message ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: `flex items-start gap-1.5 text-xs leading-relaxed ${ok ? "text-ok" : "text-bad"}`,
				children: [ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "mt-0.5 size-3.5 shrink-0" }) : null, message]
			}) : saved ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "flex items-center gap-1.5 text-xs text-ok",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-3.5" }), "本機已儲存 Gemini 金鑰"]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs leading-relaxed text-muted",
				children: [
					"若要全班共用、學生不用各自申請，到 Vercel → Settings → Environment Variables 新增",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-ink-soft",
						children: "GEMINI_API_KEY"
					}),
					"，再 Redeploy。"
				]
			})
		]
	});
}
var useUiStore = create((set) => ({
	tutorOpen: false,
	setTutorOpen: (tutorOpen) => set({ tutorOpen })
}));
var SUGGEST = [
	"這句的白話語譯是什麼？",
	"這篇的主旨與論證結構？",
	"列出三個必考實詞。"
];
function TutorDock() {
	const open = useUiStore((s) => s.tutorOpen);
	const setOpen = useUiStore((s) => s.setTutorOpen);
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const articleId = pathname.match(/^\/read\/([^/]+)/)?.[1];
	const article = articleId ? getArticle(articleId) : void 0;
	const inGame = pathname.startsWith("/games/");
	const [messages, setMessages] = (0, import_react.useState)([]);
	const [input, setInput] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [settings, setSettings] = (0, import_react.useState)(false);
	const [status, setStatus] = (0, import_react.useState)(null);
	const [hasLocalKey, setHasLocalKey] = (0, import_react.useState)(false);
	const listRef = (0, import_react.useRef)(null);
	const placeholder = (0, import_react.useMemo)(() => article ? `問《${article.title.replace(/[《》]/g, "")}》…` : "向書齋助教提問…", [article]);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		setHasLocalKey(Boolean(getGeminiKey()));
		aiStatus().then(setStatus).catch(() => setStatus(null));
	}, [open]);
	const ready = hasLocalKey || Boolean(status?.geminiEnv || status?.xaiEnv);
	async function send(text) {
		const trimmed = text.trim();
		if (!trimmed || busy) return;
		if (!ready) {
			setSettings(true);
			setError("請先連接 Gemini API 金鑰。");
			return;
		}
		const next = [...messages, {
			role: "user",
			content: trimmed
		}];
		setMessages(next);
		setInput("");
		setBusy(true);
		setError(null);
		try {
			const result = await askTutor({
				articleId,
				messages: next
			});
			if (result.ok) setMessages([...next, {
				role: "assistant",
				content: result.text
			}]);
			else {
				setError(result.error);
				if (result.needsKey) setSettings(true);
			}
		} catch {
			setError("連線失敗，請稍後再試。");
		} finally {
			setBusy(false);
			window.setTimeout(() => {
				listRef.current?.scrollTo({
					top: listRef.current.scrollHeight,
					behavior: "smooth"
				});
			}, 40);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: () => setOpen(!open),
		className: cn("fixed z-[60] inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink text-sm font-medium text-paper shadow-page hover:opacity-90", inGame ? "bottom-24 right-4" : "bottom-5 right-4", "w-12 sm:w-auto sm:px-4"),
		"aria-label": "開啟 AI 助教",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bot, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "hidden sm:inline",
			children: "AI 助教"
		})]
	}), open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("fixed right-4 z-[70] flex h-[min(72vh,520px)] w-[min(calc(100vw-2rem),380px)] flex-col overflow-hidden rounded-xl border border-line bg-paper-card shadow-page", inGame ? "bottom-40" : "bottom-20"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex items-center justify-between border-b border-line px-4 py-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-serif text-base font-bold",
				children: "書齋助教"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-[11px] text-muted",
				children: [article ? `正在讀 ${article.title}` : "十二篇指定範文隨時問", hasLocalKey || status?.geminiEnv ? " · Gemini" : ready ? " · 已連線" : " · 未連線"]
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setSettings((value) => !value),
					className: cn("rounded-md p-2 hover:bg-paper-deep", settings ? "text-accent" : "text-muted"),
					"aria-label": "AI 連線設定",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings2, { className: "size-4" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setOpen(false),
					className: "rounded-md p-2 text-muted hover:bg-paper-deep",
					"aria-label": "關閉",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
				})]
			})]
		}), settings ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex-1 overflow-y-auto px-4 py-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GeminiSetup, {
				status,
				onSaved: () => {
					setHasLocalKey(Boolean(getGeminiKey()));
					setError(null);
				}
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			ref: listRef,
			className: "flex-1 space-y-3 overflow-y-auto px-4 py-3",
			children: [
				messages.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3 pt-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm leading-relaxed text-ink-soft",
							children: "可以問語譯、詞義、寫作手法或默書易錯點。助教會根據指定範文回答。"
						}),
						!ready ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setSettings(true),
							className: "w-full rounded-lg border border-accent bg-accent-mist px-3 py-2 text-left text-sm text-ink",
							children: "尚未連接 Gemini，點此貼上 API 金鑰。"
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-col gap-2",
							children: SUGGEST.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => send(item),
								className: "rounded-lg border border-line bg-paper-deep px-3 py-2 text-left text-sm text-ink hover:border-accent",
								children: item
							}, item))
						})
					]
				}) : messages.map((msg, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: cn("max-w-[92%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap", msg.role === "user" ? "ml-auto bg-accent text-accent-fg" : "bg-paper-deep text-ink"),
					children: msg.content
				}, i)),
				busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted",
					children: "正在批閱…"
				}) : null,
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-bad",
					children: error
				}) : null
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "flex gap-2 border-t border-line p-3",
			onSubmit: (event) => {
				event.preventDefault();
				send(input);
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				value: input,
				onChange: (event) => setInput(event.target.value),
				placeholder,
				className: "h-11 flex-1 rounded-md border border-line bg-paper-deep px-3 text-sm outline-none focus:ring-2 focus:ring-accent"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "submit",
				size: "icon",
				disabled: busy || !input.trim(),
				"aria-label": "送出",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "size-4" })
			})]
		})] })]
	}) : null] });
}
function mulberry32(seed) {
	return () => {
		let t = seed += 1831565813;
		t = Math.imul(t ^ t >>> 15, t | 1);
		t ^= t + Math.imul(t ^ t >>> 7, t | 61);
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
function makeStalks(count) {
	const rand = mulberry32(20260823);
	const stalks = [];
	for (let i = 0; i < count; i++) {
		const left = i < count / 2;
		const slot = left ? i : i - Math.floor(count / 2);
		const slots = Math.ceil(count / 2);
		const x = (left ? .9 + slot / Math.max(slots - 1, 1) * 9.5 : 89.4 + slot / Math.max(slots - 1, 1) * 9.5) + (rand() - .5) * 1.4;
		const segs = 3 + Math.floor(rand() * 3);
		const height = 42 + rand() * 52;
		const thick = .55 + rand() * .85;
		const leaves = [];
		for (let s = 1; s <= segs; s++) {
			const y = 100 - s / segs * height + (rand() - .5) * 2;
			const n = 3 + Math.floor(rand() * 3);
			for (let k = 0; k < n; k++) {
				const dir = k % 2 === 0 ? -1 : 1;
				leaves.push({
					x: x + dir * (.4 + rand() * 1.1),
					y: y + (rand() - .5) * 2.2,
					rot: dir * (18 + rand() * 52) + (rand() - .5) * 8,
					len: 4.2 + rand() * 5.5,
					wide: .7 + rand() * .7,
					dark: .55 + rand() * .4
				});
			}
		}
		stalks.push({
			id: i,
			x,
			lean: (left ? 1 : -1) * (1.5 + rand() * 6) + (rand() - .5) * 2,
			height,
			thick,
			segs,
			layer: i % 3,
			growAt: rand() * .22,
			leaves
		});
	}
	return stalks;
}
function easeOut(t) {
	return 1 - (1 - t) ** 3;
}
function clamp$1(n, a = 0, b = 1) {
	return Math.min(b, Math.max(a, n));
}
function culmRibbon(stalk) {
	const top = 100 - stalk.height;
	const left = [];
	const right = [];
	const steps = stalk.segs * 5;
	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const y = 102 - t * (102 - top);
		const wobble = Math.sin(t * 5.2 + stalk.id) * .42;
		const x = stalk.x + wobble;
		const w = stalk.thick * (1.2 - t * .55);
		left.push(`${x - w} ${y}`);
		right.unshift(`${x + w} ${y}`);
	}
	return `M ${left.join(" L ")} L ${right.join(" L ")} Z`;
}
function BambooGrove({ progress, reduced, compact }) {
	const stalks = (0, import_react.useMemo)(() => makeStalks(compact ? 8 : 12), [compact]);
	const p = reduced ? .7 : progress;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		className: "pointer-events-none absolute inset-0 h-full w-full",
		viewBox: "0 0 100 100",
		preserveAspectRatio: "none",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
				id: "mist",
				x1: "0",
				y1: "1",
				x2: "0",
				y2: "0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
					offset: "0",
					stopColor: "currentColor",
					stopOpacity: "0.1"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
					offset: "1",
					stopColor: "currentColor",
					stopOpacity: "0"
				})]
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "0",
				y: "78",
				width: "100",
				height: "22",
				fill: "url(#mist)",
				className: "text-ink"
			}),
			stalks.map((stalk) => {
				const local = Math.max(.2, easeOut(clamp$1((p - stalk.growAt) / .7)));
				const leafT = easeOut(clamp$1((local - .22) / .6));
				const opacity = [
					.58,
					.82,
					1
				][stalk.layer];
				const yShift = (1 - local) * stalk.height;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
					transform: `translate(0 ${yShift})`,
					opacity: local * opacity,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
						transform: `rotate(${stalk.lean} ${stalk.x} 100)`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								d: culmRibbon(stalk),
								fill: "currentColor"
							}),
							Array.from({ length: stalk.segs }).map((_, i) => {
								const y = 102 - (i + 1) / stalk.segs * stalk.height;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
									cx: stalk.x,
									cy: y,
									rx: stalk.thick * 1.35,
									ry: .38,
									fill: "currentColor",
									opacity: .85
								}, i);
							}),
							stalk.leaves.map((leaf, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
								transform: `translate(${leaf.x} ${leaf.y}) rotate(${leaf.rot})`,
								opacity: leafT * leaf.dark,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
									d: `M 0 0 Q ${leaf.len * .42} ${-leaf.wide} ${leaf.len} 0 Q ${leaf.len * .42} ${leaf.wide * .72} 0 0`,
									fill: "currentColor"
								})
							}, i))
						]
					})
				}, stalk.id);
			})
		]
	});
}
function clamp(n, a, b) {
	return Math.min(b, Math.max(a, n));
}
function BrushTrail({ enabled, dark }) {
	const canvasRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!enabled) return;
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		let dpr = Math.min(window.devicePixelRatio || 1, 2);
		let w = 0;
		let h = 0;
		let raf = 0;
		let running = true;
		const points = [];
		let lastX = 0;
		let lastY = 0;
		let lastT = 0;
		let lastSpeed = 0;
		let dirty = false;
		const resize = () => {
			dpr = Math.min(window.devicePixelRatio || 1, 2);
			w = window.innerWidth;
			h = window.innerHeight;
			canvas.width = Math.floor(w * dpr);
			canvas.height = Math.floor(h * dpr);
			canvas.style.width = `${w}px`;
			canvas.style.height = `${h}px`;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		};
		const ink = dark ? "235, 228, 214" : "28, 25, 21";
		const drawNib = (x, y, width, alpha, angle) => {
			ctx.save();
			ctx.translate(x, y);
			ctx.rotate(angle);
			ctx.fillStyle = `rgba(${ink},${alpha})`;
			ctx.beginPath();
			ctx.ellipse(0, 0, width * .55, width * 1.15, 0, 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();
		};
		const tick = () => {
			if (!running) return;
			raf = requestAnimationFrame(tick);
			if (!dirty && points.length === 0) return;
			ctx.clearRect(0, 0, w, h);
			for (let i = points.length - 1; i >= 0; i--) {
				points[i].life -= .016;
				if (points[i].life <= 0) points.splice(i, 1);
			}
			for (let i = 1; i < points.length; i++) {
				const a = points[i - 1];
				const b = points[i];
				const dx = b.x - a.x;
				const dy = b.y - a.y;
				const dist = Math.hypot(dx, dy) || 1;
				const angle = Math.atan2(dy, dx) + Math.PI / 2;
				const steps = Math.max(1, Math.ceil(dist / 2.4));
				for (let s = 0; s <= steps; s++) {
					const t = s / steps;
					const x = a.x + dx * t;
					const y = a.y + dy * t;
					const width = a.w + (b.w - a.w) * t;
					const alpha = Math.max(0, (a.life + (b.life - a.life) * t) * .28);
					drawNib(x, y, width, alpha, angle);
				}
			}
			dirty = points.length > 0;
		};
		const onMove = (event) => {
			if (event.pointerType !== "mouse") return;
			const now = performance.now();
			const dt = Math.max(8, now - (lastT || now));
			const x = event.clientX;
			const y = event.clientY;
			const speed = (lastT ? Math.hypot(x - lastX, y - lastY) : 0) / dt;
			const width = 13.5 - clamp(speed / 1.35, 0, 1) * 11.2;
			points.push({
				x,
				y,
				w: width,
				life: 1
			});
			if (points.length > 90) points.shift();
			if (lastT && lastSpeed - speed > .55 && Math.random() > .55) {
				const splat = 1 + Math.floor(Math.random() * 3);
				for (let i = 0; i < splat; i++) points.push({
					x: x + (Math.random() - .5) * 18,
					y: y + (Math.random() - .5) * 18,
					w: 1.2 + Math.random() * 2.4,
					life: .55 + Math.random() * .3
				});
			}
			lastX = x;
			lastY = y;
			lastT = now;
			lastSpeed = speed;
			dirty = true;
		};
		const onLeave = () => {
			lastT = 0;
		};
		const onVisibility = () => {
			if (document.hidden) points.length = 0;
		};
		resize();
		window.addEventListener("resize", resize);
		window.addEventListener("pointermove", onMove, { passive: true });
		window.addEventListener("pointerleave", onLeave);
		document.addEventListener("visibilitychange", onVisibility);
		raf = requestAnimationFrame(tick);
		return () => {
			running = false;
			cancelAnimationFrame(raf);
			window.removeEventListener("resize", resize);
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerleave", onLeave);
			document.removeEventListener("visibilitychange", onVisibility);
		};
	}, [enabled, dark]);
	if (!enabled) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
		ref: canvasRef,
		className: "pointer-events-none fixed inset-0 z-[1]",
		"aria-hidden": "true"
	});
}
function useMedia(query) {
	const [matches, setMatches] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const mq = window.matchMedia(query);
		const onChange = () => setMatches(mq.matches);
		onChange();
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, [query]);
	return matches;
}
function useScrollProgress(reduced) {
	const [progress, setProgress] = (0, import_react.useState)(reduced ? .62 : 0);
	(0, import_react.useEffect)(() => {
		if (reduced) {
			setProgress(.62);
			return;
		}
		let raf = 0;
		const update = () => {
			const max = document.documentElement.scrollHeight - window.innerHeight;
			setProgress(max <= 0 ? 0 : Math.min(1, window.scrollY / max));
		};
		const onScroll = () => {
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(update);
		};
		update();
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll);
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
		};
	}, [reduced]);
	return progress;
}
function InkStage({ paused }) {
	const reduced = useMedia("(prefers-reduced-motion: reduce)");
	const compact = useMedia("(max-width: 720px)");
	const finePointer = useMedia("(pointer: fine)");
	const dark = useMedia("(prefers-color-scheme: dark)");
	const [isDark, setIsDark] = (0, import_react.useState)(false);
	const progress = useScrollProgress(reduced);
	(0, import_react.useEffect)(() => {
		const sync = () => setIsDark(document.documentElement.classList.contains("dark"));
		sync();
		const obs = new MutationObserver(sync);
		obs.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"]
		});
		return () => obs.disconnect();
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		id: "ink-stage",
		className: "pointer-events-none fixed inset-0 z-0 overflow-hidden",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-0 text-ink",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BambooGrove, {
				progress,
				reduced,
				compact
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrushTrail, {
			enabled: !paused && !reduced && finePointer,
			dark: isDark || dark
		})]
	});
}
var links = [
	{
		to: "/",
		label: "總覽"
	},
	{
		to: "/games",
		label: "趣味闖關"
	},
	{
		to: "/quiz",
		label: "深度測驗"
	},
	{
		to: "/dictation",
		label: "默書練習"
	}
];
function NavBar({ dark, onToggleTheme, onOpenProgress }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
		className: "sticky top-0 z-50 border-b border-line/80 bg-paper/85 backdrop-blur-md",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/",
				className: "flex min-w-0 items-center gap-2 font-serif text-lg font-bold text-accent",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "size-5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "truncate",
					children: ["範文十二式", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ml-2 align-middle rounded-full bg-seal/12 px-2 py-0.5 text-[10px] font-sans font-bold tracking-wide text-seal",
						children: "水墨版"
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
				className: "flex items-center gap-1 sm:gap-2",
				children: [
					links.map((link) => {
						const active = link.to === "/" ? pathname === "/" : pathname.startsWith(link.to);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: link.to,
							className: cn("hidden h-10 items-center rounded-md px-3 text-sm font-medium transition-colors duration-150 lg:inline-flex", active ? "bg-accent-mist text-accent" : "text-ink-soft hover:bg-paper-deep hover:text-ink"),
							children: link.label
						}, link.to);
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/games",
						className: "inline-flex size-10 items-center justify-center rounded-md text-ink-soft hover:bg-paper-deep lg:hidden",
						"aria-label": "趣味闖關",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gamepad2, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/quiz",
						className: "inline-flex size-10 items-center justify-center rounded-md text-ink-soft hover:bg-paper-deep lg:hidden",
						"aria-label": "深度測驗",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/dictation",
						className: "inline-flex size-10 items-center justify-center rounded-md text-ink-soft hover:bg-paper-deep lg:hidden",
						"aria-label": "默書練習",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PenLine, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "ghost",
						size: "sm",
						onClick: onOpenProgress,
						className: "text-accent",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartNoAxesColumn, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden sm:inline",
							children: "學習進度"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						onClick: onToggleTheme,
						"aria-label": "切換深色模式",
						children: dark ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "size-4 text-accent" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: "size-4 text-accent" })
					})
				]
			})]
		})
	});
}
function shuffle(items) {
	const next = [...items];
	for (let i = next.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[next[i], next[j]] = [next[j], next[i]];
	}
	return next;
}
function pickArticle(articleId) {
	if (articleId && articleId !== "all") {
		const found = getArticle(articleId);
		return found ? [found] : articles;
	}
	return articles;
}
function quoteFor(article, word) {
	const hit = article.p.find((para) => para.t.includes(word));
	if (!hit) return article.p[0]?.t ?? "";
	const clipped = hit.t.replace(/\n/g, "");
	return clipped.length > 42 ? `${clipped.slice(0, 42)}…` : clipped;
}
function getVocabChallenges(articleId) {
	const pool = pickArticle(articleId);
	const allMeanings = articles.flatMap((item) => item.v.map((v) => v.m));
	const list = [];
	for (const article of pool) for (const vocab of article.v) {
		const distractors = shuffle(allMeanings.filter((meaning) => meaning !== vocab.m)).slice(0, 2);
		if (distractors.length < 2) continue;
		list.push({
			articleId: article.id,
			title: article.title,
			word: vocab.w,
			meaning: vocab.m.replace(/。$/, ""),
			distractors: distractors.map((item) => item.replace(/。$/, "")),
			quote: quoteFor(article, vocab.w)
		});
	}
	return shuffle(list);
}
function getQuizPool(articleId) {
	return shuffle(pickArticle(articleId).flatMap((article) => article.q.map((item) => ({
		...item,
		articleId: article.id,
		title: article.title
	}))));
}
function getFlashPairs(articleId) {
	return shuffle(pickArticle(articleId).flatMap((article) => article.v.map((item) => ({
		front: item.w,
		back: item.m.replace(/。$/, ""),
		articleId: article.id,
		title: article.title
	}))));
}
var FEATURED_SORTS = [
	{
		id: "mengzi-yuxiong",
		articleId: "meng-zi",
		chunks: [
			"魚，我所欲也；熊掌，亦我所欲也。",
			"二者不可得兼，舍魚而取熊掌者也。",
			"生，亦我所欲也；義，亦我所欲也。",
			"二者不可得兼，舍生而取義者也。"
		],
		hint: "以魚與熊掌比喻生與義，帶出「舍生取義」。"
	},
	{
		id: "xunzi-xue",
		articleId: "xun-zi",
		chunks: [
			"君子曰：學不可以已。",
			"青，取之於藍，而青於藍；",
			"冰，水為之，而寒於水。",
			"故木受繩則直，金就礪則利。"
		],
		hint: "以青出於藍、金就礪則利，論證學習能改變本性。"
	},
	{
		id: "xunzi-qi",
		articleId: "xun-zi",
		chunks: [
			"故不積蹞步，無以至千里；",
			"不積小流，無以成江海。",
			"騏驥一躍，不能十步；",
			"駑馬十駕，功在不舍。",
			"鍥而舍之，朽木不折；鍥而不舍，金石可鏤。"
		],
		hint: "積累與堅持：騏驥不如駑馬十駕，功在不舍。"
	},
	{
		id: "hanyu-shi",
		articleId: "han-yu",
		chunks: [
			"古之學者必有師。",
			"師者，所以傳道、受業、解惑也。",
			"人非生而知之者，孰能無惑？",
			"是故無貴無賤，無長無少，道之所存，師之所存也。"
		],
		hint: "擇師的唯一標準是「道」，無分貴賤長少。"
	},
	{
		id: "hanyu-zhuan",
		articleId: "han-yu",
		chunks: [
			"是故弟子不必不如師，",
			"師不必賢於弟子，",
			"聞道有先後，",
			"術業有專攻，如是而已。"
		],
		hint: "師生關係是相對的，聞道有先後。"
	},
	{
		id: "zhuge-xian",
		articleId: "zhu-ge-liang",
		chunks: [
			"親賢臣，遠小人，此先漢所以興隆也；",
			"親小人，遠賢臣，此後漢所以傾頹也。",
			"先帝在時，每與臣論此事，未嘗不歎息痛恨於桓、靈也。"
		],
		hint: "出師表以先漢／後漢對比，勸後主親賢遠佞。"
	},
	{
		id: "zhuge-buyi",
		articleId: "zhu-ge-liang",
		chunks: [
			"臣本布衣，躬耕於南陽，",
			"苟全性命於亂世，不求聞達於諸侯。",
			"先帝不以臣卑鄙，猥自枉屈，三顧臣於草廬之中，",
			"諮臣以當世之事，由是感激，遂許先帝以驅馳。",
			"後值傾覆，受任於敗軍之際，奉命於危難之間。"
		],
		hint: "自述三顧草廬與臨危受命，表明報先帝之忠。"
	},
	{
		id: "fan-ren",
		articleId: "fan-zhong-yan",
		chunks: [
			"不以物喜，不以己悲；",
			"居廟堂之高則憂其民；",
			"處江湖之遠則憂其君。",
			"是進亦憂，退亦憂。",
			"先天下之憂而憂，後天下之樂而樂。"
		],
		hint: "古仁人的境界：先憂後樂，不以物喜不以己悲。"
	},
	{
		id: "fan-rain",
		articleId: "fan-zhong-yan",
		chunks: [
			"若夫霪雨霏霏，連月不開，",
			"陰風怒號，濁浪排空；",
			"登斯樓也，則有去國懷鄉，憂讒畏譏，",
			"滿目蕭然，感極而悲者矣。"
		],
		hint: "遷客騷人因陰景而生悲，是「以物悲」。"
	},
	{
		id: "suxun-open",
		articleId: "su-xun",
		chunks: [
			"六國破滅，非兵不利，戰不善，弊在賂秦。",
			"賂秦而力虧，破滅之道也。",
			"或曰：六國互喪，率賂秦耶？",
			"曰：不賂者以賂者喪。"
		],
		hint: "中心論點：六國破滅，弊在賂秦。"
	},
	{
		id: "zhuang-peng",
		articleId: "zhuang-zi",
		chunks: [
			"北冥有魚，其名為鯤。",
			"鯤之大，不知其幾千里也。",
			"化而為鳥，其名為鵬。",
			"鵬之背，不知其幾千里也；",
			"怒而飛，其翼若垂天之雲。"
		],
		hint: "以鯤鵬變化開篇，寫「逍遙」需積厚。"
	},
	{
		id: "liuzongyuan",
		articleId: "liu-zong-yuan",
		chunks: [
			"自余為僇人，居是州，恆惴慄。",
			"其隙也，則施施而行，漫漫而遊。",
			"日與其徒上高山，入深林，窮回溪，",
			"幽泉怪石，無遠不到。"
		],
		hint: "謫居永州，先寫惴慄，再寫漫遊排遣。"
	}
];
function splitSentences(text) {
	return text.replace(/\n/g, "").split(/(?<=[。！？])/).map((item) => item.trim()).filter((item) => item.length >= 4);
}
function autoSortPuzzles(article) {
	const puzzles = [];
	article.p.forEach((para, index) => {
		let chunks = splitSentences(para.t);
		const expanded = [];
		for (const chunk of chunks) if (chunk.length > 30 && chunk.includes("；")) {
			const bits = chunk.split("；").map((bit, i, arr) => i < arr.length - 1 ? `${bit}；` : bit);
			expanded.push(...bits.filter((bit) => bit.length >= 4));
		} else expanded.push(chunk);
		chunks = expanded;
		const push = (slice, key) => {
			if (slice.length < 3 || slice.length > 6) return;
			if (slice.some((item) => item.length > 48)) return;
			puzzles.push({
				id: `${article.id}-auto-${key}`,
				articleId: article.id,
				title: article.title,
				chunks: slice,
				hint: para.h || article.c[0] || "請按原文順序排列。"
			});
		};
		if (chunks.length >= 3 && chunks.length <= 6) push(chunks, String(index));
		else if (chunks.length > 6) push(chunks.slice(0, 5), `${index}-a`);
	});
	return puzzles.slice(0, 3);
}
function getSortPuzzles(articleId) {
	const pool = pickArticle(articleId);
	const featured = FEATURED_SORTS.filter((item) => pool.some((article) => article.id === item.articleId)).map((item) => ({
		...item,
		title: getArticle(item.articleId)?.title ?? item.articleId
	}));
	const auto = pool.flatMap(autoSortPuzzles);
	const seen = /* @__PURE__ */ new Set();
	const merged = [];
	for (const puzzle of [...featured, ...auto]) {
		const key = puzzle.chunks.join("|");
		if (seen.has(key)) continue;
		seen.add(key);
		merged.push(puzzle);
	}
	return shuffle(merged);
}
function getBlankPuzzles(articleId) {
	return shuffle(pickArticle(articleId).flatMap((article) => article.dictation.map((item, index) => {
		const naked = item.text.replace(/[{}]/g, "");
		const para = article.p.find((row) => row.t.includes(naked.slice(0, 8)) || naked.includes(row.t.slice(0, 8)));
		return {
			id: `${article.id}-blank-${index}`,
			articleId: article.id,
			title: article.title,
			text: item.text,
			hint: para?.h || article.c[0] || "根據語譯與課文記憶填空。"
		};
	})));
}
function parseBlanks(text) {
	const parts = [];
	const re = /\{([^}]+)\}/g;
	let last = 0;
	let blankIndex = 0;
	let match;
	while (match = re.exec(text)) {
		if (match.index > last) parts.push({
			type: "text",
			value: text.slice(last, match.index)
		});
		parts.push({
			type: "blank",
			answer: match[1],
			index: blankIndex
		});
		blankIndex += 1;
		last = match.index + match[0].length;
	}
	if (last < text.length) parts.push({
		type: "text",
		value: text.slice(last)
	});
	return parts;
}
var GAME_META = [
	{
		id: "snake",
		to: "/games/snake",
		title: "詞解貪食蛇",
		kicker: "直覺反應",
		blurb: "地圖上同時出現對錯解釋，操控墨蛇吃掉正確詞義。吃對加長，吃錯扣心。"
	},
	{
		id: "time",
		to: "/games/time",
		title: "限時生存戰",
		kicker: "瘋狂刷題",
		blurb: "六十秒倒數。答對加三秒、答錯扣五秒，連擊越高分數越兇。"
	},
	{
		id: "match",
		to: "/games/match",
		title: "字義翻牌",
		kicker: "配對記憶",
		blurb: "文言詞與白話語譯各一組牌，翻出正確配對才能消去。"
	},
	{
		id: "sort",
		to: "/games/sort",
		title: "課文重組",
		kicker: "脈絡默書",
		blurb: "把《出師表》《岳陽樓記》等長段打散，拖曳回原文順序。"
	},
	{
		id: "hangman",
		to: "/games/hangman",
		title: "名句填字謎",
		kicker: "三命解謎",
		blurb: "給出語譯提示與課文空格，只有三次猜錯機會，血條會下降。"
	}
];
var PROGRESS_KEY = "dse_progress";
var ANSWERS_KEY = "dse_quiz_answers";
function emptyProgress() {
	return {
		quizScore: 0,
		quizTotal: 0,
		dictScore: 0,
		dictTotal: 0,
		score: 0,
		total: 0,
		percent: 0
	};
}
function read$1(key, fallback) {
	if (typeof window === "undefined") return fallback;
	try {
		const raw = localStorage.getItem(key);
		return raw ? JSON.parse(raw) : fallback;
	} catch {
		return fallback;
	}
}
function set(key, value) {
	localStorage.setItem(key, JSON.stringify(value));
}
function loadProgress() {
	return read$1(PROGRESS_KEY, {});
}
function saveQuizResult(articleId, score, total) {
	const progress = loadProgress();
	const current = progress[articleId] ?? emptyProgress();
	current.quizScore = score;
	current.quizTotal = total;
	current.score = current.quizScore + current.dictScore;
	current.total = current.quizTotal + current.dictTotal;
	current.percent = current.total > 0 ? Math.round(current.score / current.total * 100) : 0;
	progress[articleId] = current;
	set(PROGRESS_KEY, progress);
	return current;
}
function saveDictationResult(articleId, score, total) {
	const progress = loadProgress();
	const current = progress[articleId] ?? emptyProgress();
	current.dictScore = score;
	current.dictTotal = total;
	current.score = current.quizScore + current.dictScore;
	current.total = current.quizTotal + current.dictTotal;
	current.percent = current.total > 0 ? Math.round(current.score / current.total * 100) : 0;
	progress[articleId] = current;
	set(PROGRESS_KEY, progress);
	return current;
}
function recordQuizAnswer(articleId, index, correct) {
	const answers = read$1(ANSWERS_KEY, {});
	if (!answers[articleId]) answers[articleId] = {};
	answers[articleId][index] = correct;
	set(ANSWERS_KEY, answers);
	const record = answers[articleId];
	const total = articles.find((item) => item.id === articleId)?.q.length ?? 0;
	const score = Object.values(record).filter(Boolean).length;
	saveQuizResult(articleId, score, total);
}
function clearAnswers(articleId) {
	const answers = read$1(ANSWERS_KEY, {});
	delete answers[articleId];
	set(ANSWERS_KEY, answers);
}
function countStarted(progress) {
	return articles.filter((item) => {
		const row = progress[item.id];
		return row && (row.quizTotal > 0 || row.dictTotal > 0);
	}).length;
}
var KEY = "dse_game_scores_v1";
var EMPTY = {
	snake: 0,
	time: 0,
	match: 0,
	sort: 0,
	hangman: 0
};
function read() {
	if (typeof window === "undefined") return { ...EMPTY };
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return { ...EMPTY };
		return {
			...EMPTY,
			...JSON.parse(raw)
		};
	} catch {
		return { ...EMPTY };
	}
}
function loadScores() {
	return read();
}
function getHighScore(id) {
	return read()[id] ?? 0;
}
function submitScore(id, score) {
	const board = read();
	const prev = board[id] ?? 0;
	const isNew = score > prev;
	if (isNew) {
		board[id] = score;
		localStorage.setItem(KEY, JSON.stringify(board));
	}
	return {
		high: Math.max(prev, score),
		isNew
	};
}
function ProgressDialog({ open, progress, onClose }) {
	const started = (0, import_react.useMemo)(() => countStarted(progress), [progress]);
	const overall = Math.round(started / articles.length * 100) || 0;
	const [scores, setScores] = (0, import_react.useState)(loadScores);
	(0, import_react.useEffect)(() => {
		if (open) setScores(loadScores());
	}, [open]);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const onKey = (event) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, onClose]);
	if (!open) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm",
		onClick: onClose,
		role: "presentation",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": "progress-title",
			className: "relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-line bg-paper-card p-6 shadow-page",
			onClick: (event) => event.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onClose,
					className: "absolute right-4 top-4 rounded-md p-2 text-muted hover:bg-paper-deep hover:text-ink",
					"aria-label": "關閉",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					id: "progress-title",
					className: "font-serif text-2xl font-bold text-accent",
					children: "學習進度報告"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 rounded-lg bg-paper-deep/80 p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-2 flex items-end justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
							className: "text-ink",
							children: "全站測驗與默書總進度"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-sm font-bold tabular-nums text-accent",
							children: [
								"已學習 ",
								started,
								" / ",
								articles.length,
								" 篇（",
								overall,
								"%）"
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-3 overflow-hidden rounded-full bg-accent-mist",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-full rounded-full bg-accent transition-[width] duration-500",
							style: { width: `${overall}%` }
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5",
					children: GAME_META.map((game) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg border border-line bg-paper-deep/70 px-3 py-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[11px] text-muted",
							children: game.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-serif text-lg font-bold tabular-nums text-ink",
							children: scores[game.id] ?? 0
						})]
					}, game.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6 space-y-5",
					children: articles.map((item) => {
						const row = progress[item.id];
						const percent = row?.percent ?? 0;
						const startedItem = row && (row.quizTotal > 0 || row.dictTotal > 0);
						const tone = !startedItem ? "bg-line" : percent >= 80 ? "bg-ok" : percent >= 50 ? "bg-accent" : "bg-seal";
						const label = startedItem && row ? `${row.score}/${row.total} 題（${percent}%）` : "尚未開始";
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-1 flex items-center justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-serif font-bold text-ink",
									children: item.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: cn("text-sm font-bold tabular-nums", startedItem ? "text-ink-soft" : "text-muted"),
									children: label
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-2 rounded-full bg-paper-deep",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: cn("h-2 rounded-full transition-[width] duration-500", tone),
									style: { width: `${percent}%` }
								})
							}),
							startedItem && row ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-1 flex gap-4 text-xs text-muted",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["選擇題：", row.quizTotal > 0 ? `${row.quizScore}/${row.quizTotal}` : "未測驗"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["默書：", row.dictTotal > 0 ? `${row.dictScore}/${row.dictTotal}` : "未測驗"] })]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-1 block text-xs text-muted",
								children: "尚未開始學習"
							})
						] }, item.id);
					})
				})
			]
		})
	});
}
var THEME_KEY = "fanwen-theme";
function readStoredTheme() {
	if (typeof window === "undefined") return "light";
	try {
		return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
	} catch {
		return "light";
	}
}
function applyTheme(theme) {
	document.documentElement.classList.toggle("dark", theme === "dark");
	localStorage.setItem(THEME_KEY, theme);
}
var THEME_BOOT_SCRIPT = `try{if(localStorage.getItem('${THEME_KEY}')==='dark')document.documentElement.classList.add('dark')}catch(e){}`;
function AppShell({ children }) {
	const [dark, setDark] = (0, import_react.useState)(false);
	const [progressOpen, setProgressOpen] = (0, import_react.useState)(false);
	const [progress, setProgress] = (0, import_react.useState)({});
	const tutorOpen = useUiStore((s) => s.tutorOpen);
	const inGame = useRouterState({ select: (s) => s.location.pathname }).startsWith("/games/");
	(0, import_react.useEffect)(() => {
		setDark(readStoredTheme() === "dark");
	}, []);
	const refreshProgress = (0, import_react.useCallback)(() => {
		setProgress(loadProgress());
	}, []);
	(0, import_react.useEffect)(() => {
		if (progressOpen) refreshProgress();
	}, [progressOpen, refreshProgress]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "paper-grain relative min-h-screen bg-paper text-ink",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InkStage, { paused: progressOpen || tutorOpen || inGame }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative z-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavBar, {
					dark,
					onToggleTheme: () => {
						const next = dark ? "light" : "dark";
						applyTheme(next);
						setDark(next === "dark");
					},
					onOpenProgress: () => setProgressOpen(true)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
					className: "mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-10 lg:px-6",
					children
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TutorDock, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProgressDialog, {
				open: progressOpen,
				progress,
				onClose: () => setProgressOpen(false)
			})
		]
	});
}
var styles_default = "/assets/styles-CmQ67zFR.css";
var APP_NAME = "範文十二式";
var Route$11 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: "香港文憑試中文科十二篇指定範文：原文、詞解、測驗、默書、趣味闖關與 AI 助教。"
			},
			{
				name: "theme-color",
				content: "#2F5D56"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Noto+Sans+HK:wght@400;500;700&family=Noto+Serif+HK:wght@500;700;900&display=swap"
			}
		]
	}),
	component: RootDocument
});
function RootDocument() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "zh-HK",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("script", { dangerouslySetInnerHTML: { __html: THEME_BOOT_SCRIPT } }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
		] })]
	});
}
var $$splitComponentImporter$10 = () => import("./routes-DkB4kY8c.mjs");
var Route$10 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$10, "component") });
var $$splitComponentImporter$9 = () => import("./dictation-DI2n8_rn.mjs");
var Route$9 = createFileRoute("/dictation")({
	validateSearch: (search) => ({ id: typeof search.id === "string" ? search.id : void 0 }),
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var $$splitComponentImporter$8 = () => import("./games-BKJp-MJP.mjs");
var Route$8 = createFileRoute("/games")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
var $$splitComponentImporter$7 = () => import("./quiz-CMRkVaMu.mjs");
var Route$7 = createFileRoute("/quiz")({
	validateSearch: (search) => ({ id: typeof search.id === "string" ? search.id : void 0 }),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("./games.index-BqK-Dh3T.mjs");
var Route$6 = createFileRoute("/games/")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
var $$splitComponentImporter$5 = () => import("./games.hangman-EKDXGPGt.mjs");
var Route$5 = createFileRoute("/games/hangman")({
	validateSearch: (search) => ({ id: typeof search.id === "string" ? search.id : void 0 }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./games.match-BOzJfjp7.mjs");
var Route$4 = createFileRoute("/games/match")({
	validateSearch: (search) => ({ id: typeof search.id === "string" ? search.id : void 0 }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./games.snake-C76Ooj24.mjs");
var Route$3 = createFileRoute("/games/snake")({
	validateSearch: (search) => ({ id: typeof search.id === "string" ? search.id : void 0 }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./games.sort-D9QzHmM3.mjs");
var Route$2 = createFileRoute("/games/sort")({
	validateSearch: (search) => ({ id: typeof search.id === "string" ? search.id : void 0 }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./games.time-CyaRhM8Z.mjs");
var Route$1 = createFileRoute("/games/time")({
	validateSearch: (search) => ({ id: typeof search.id === "string" ? search.id : void 0 }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./read._id-DZKDA7IX.mjs");
var Route = createFileRoute("/read/$id")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var IndexRoute = Route$10.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$11
});
var DictationRoute = Route$9.update({
	id: "/dictation",
	path: "/dictation",
	getParentRoute: () => Route$11
});
var GamesRoute = Route$8.update({
	id: "/games",
	path: "/games",
	getParentRoute: () => Route$11
});
var QuizRoute = Route$7.update({
	id: "/quiz",
	path: "/quiz",
	getParentRoute: () => Route$11
});
var GamesIndexRoute = Route$6.update({
	id: "/",
	path: "/",
	getParentRoute: () => GamesRoute
});
var GamesHangmanRoute = Route$5.update({
	id: "/hangman",
	path: "/hangman",
	getParentRoute: () => GamesRoute
});
var GamesMatchRoute = Route$4.update({
	id: "/match",
	path: "/match",
	getParentRoute: () => GamesRoute
});
var GamesSnakeRoute = Route$3.update({
	id: "/snake",
	path: "/snake",
	getParentRoute: () => GamesRoute
});
var GamesSortRoute = Route$2.update({
	id: "/sort",
	path: "/sort",
	getParentRoute: () => GamesRoute
});
var GamesTimeRoute = Route$1.update({
	id: "/time",
	path: "/time",
	getParentRoute: () => GamesRoute
});
var ReadIdRoute = Route.update({
	id: "/read/$id",
	path: "/read/$id",
	getParentRoute: () => Route$11
});
var GamesRouteChildren = {
	GamesHangmanRoute,
	GamesMatchRoute,
	GamesSnakeRoute,
	GamesSortRoute,
	GamesTimeRoute,
	GamesIndexRoute
};
var rootRouteChildren = {
	IndexRoute,
	DictationRoute,
	GamesRoute: GamesRoute._addFileChildren(GamesRouteChildren),
	QuizRoute,
	ReadIdRoute
};
var routeTree = Route$11._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { shuffle as C, askGrade as D, askGenerateQuiz as E, Button as O, parseBlanks as S, askExplain as T, getBlankPuzzles as _, Route$3 as a, getSortPuzzles as b, Route$7 as c, loadScores as d, submitScore as f, GAME_META as g, saveDictationResult as h, Route$2 as i, cn as k, Route$9 as l, recordQuizAnswer as m, Route as n, Route$4 as o, clearAnswers as p, Route$1 as r, Route$5 as s, router_exports as t, getHighScore as u, getFlashPairs as v, useUiStore as w, getVocabChallenges as x, getQuizPool as y };
