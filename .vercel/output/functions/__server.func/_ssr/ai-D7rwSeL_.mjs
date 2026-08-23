import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { a as explainMessages, c as gradeMessages, f as tutorMessages, i as completeGemini, o as generateQuizMessages, t as AI_TOKENS, u as parseGeneratedQuiz } from "./gemini-BmjONweS.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ai-D7rwSeL_.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
function envGeminiKey() {
	return (process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
}
function resolveProvider(clientKey) {
	const gemini = (clientKey ?? "").trim() || envGeminiKey();
	if (gemini) return {
		provider: "gemini",
		key: gemini
	};
	const xai = (process.env.XAI_API_KEY ?? "").trim();
	if (xai) return {
		provider: "xai",
		key: xai
	};
	return null;
}
async function completeXai(apiKey, messages, maxTokens) {
	const res = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: "grok-4.5",
			messages,
			max_tokens: maxTokens,
			temperature: .35
		}),
		signal: AbortSignal.timeout(maxTokens >= 800 ? 45e3 : 28e3)
	});
	if (!res.ok) {
		if (res.status === 401 || res.status === 403) return {
			ok: false,
			error: "備用引擎未能連線。請在設定中貼上 Gemini API 金鑰。",
			needsKey: true
		};
		return {
			ok: false,
			error: "AI 服務忙碌，請稍後再試。"
		};
	}
	const text = (await res.json()).choices?.[0]?.message?.content?.trim() ?? "";
	if (!text) return {
		ok: false,
		error: "AI 沒有回傳內容。"
	};
	return {
		ok: true,
		text
	};
}
async function complete(messages, maxTokens, clientKey, json = false) {
	const resolved = resolveProvider(clientKey);
	if (!resolved) return {
		ok: false,
		error: "尚未設定 Gemini API 金鑰。請在助教面板貼上金鑰，或於網站後台加入 GEMINI_API_KEY。",
		needsKey: true
	};
	try {
		if (resolved.provider === "gemini") return await completeGemini(resolved.key, messages, maxTokens, { json });
		return await completeXai(resolved.key, messages, maxTokens);
	} catch {
		return {
			ok: false,
			error: "連線逾時，請稍後再試。"
		};
	}
}
var aiStatus_createServerFn_handler = createServerRpc({
	id: "a0f232b5ca0187bc9fe40a301ee2940b0a5db3a672463d1e57d3938a935a6d51",
	name: "aiStatus",
	filename: "src/lib/ai.ts"
}, (opts) => aiStatus.__executeServer(opts));
var aiStatus = createServerFn({ method: "GET" }).handler(aiStatus_createServerFn_handler, async () => {
	return {
		geminiEnv: Boolean(envGeminiKey()),
		xaiEnv: Boolean((process.env.XAI_API_KEY ?? "").trim())
	};
});
var pingAi_createServerFn_handler = createServerRpc({
	id: "f313621e15afa40d27d6fa1834e943da25b305a1ca5a179312e1d50fd18d763a",
	name: "pingAi",
	filename: "src/lib/ai.ts"
}, (opts) => pingAi.__executeServer(opts));
var pingAi = createServerFn({ method: "POST" }).validator((input) => input).handler(pingAi_createServerFn_handler, async ({ data }) => {
	return complete([{
		role: "system",
		content: "只回兩個字：就緒"
	}, {
		role: "user",
		content: "測試連線"
	}], AI_TOKENS.ping, data.geminiKey);
});
var explainQuiz_createServerFn_handler = createServerRpc({
	id: "75b117e63abc8b4576ce0c9a7e13a47b7e82c2a7d4372a679cf61f8f74b85d2d",
	name: "explainQuiz",
	filename: "src/lib/ai.ts"
}, (opts) => explainQuiz.__executeServer(opts));
var explainQuiz = createServerFn({ method: "POST" }).validator((input) => input).handler(explainQuiz_createServerFn_handler, async ({ data }) => {
	return complete(explainMessages(data), AI_TOKENS.explain, data.geminiKey);
});
var gradeDictation_createServerFn_handler = createServerRpc({
	id: "9992ca6e632ed08aa35eb4a5c98bb5a8aea582a8fd1b2edb64a5ae9dc3049c67",
	name: "gradeDictation",
	filename: "src/lib/ai.ts"
}, (opts) => gradeDictation.__executeServer(opts));
var gradeDictation = createServerFn({ method: "POST" }).validator((input) => input).handler(gradeDictation_createServerFn_handler, async ({ data }) => {
	return complete(gradeMessages(data), AI_TOKENS.grade, data.geminiKey);
});
var tutorChat_createServerFn_handler = createServerRpc({
	id: "aa1f57deb989cb2243ad631467fdd8027270dc7b122a7790d873db1ae77a2d4c",
	name: "tutorChat",
	filename: "src/lib/ai.ts"
}, (opts) => tutorChat.__executeServer(opts));
var tutorChat = createServerFn({ method: "POST" }).validator((input) => input).handler(tutorChat_createServerFn_handler, async ({ data }) => {
	return complete(tutorMessages(data.articleId, data.messages), AI_TOKENS.tutor, data.geminiKey);
});
var generateQuiz_createServerFn_handler = createServerRpc({
	id: "0c5a06178f3eb2ddaac554a30d244d37cce60e9b6b9ce689aaa01bfd18804e87",
	name: "generateQuiz",
	filename: "src/lib/ai.ts"
}, (opts) => generateQuiz.__executeServer(opts));
var generateQuiz = createServerFn({ method: "POST" }).validator((input) => input).handler(generateQuiz_createServerFn_handler, async ({ data }) => {
	const built = generateQuizMessages(data.articleId);
	if ("error" in built) return {
		ok: false,
		error: built.error
	};
	const result = await complete(built, AI_TOKENS.quiz, data.geminiKey, true);
	if (!result.ok) return result;
	return parseGeneratedQuiz(result.text);
});
//#endregion
export { aiStatus_createServerFn_handler, explainQuiz_createServerFn_handler, generateQuiz_createServerFn_handler, gradeDictation_createServerFn_handler, pingAi_createServerFn_handler, tutorChat_createServerFn_handler };
