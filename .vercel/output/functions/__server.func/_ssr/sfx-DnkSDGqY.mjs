import { b as require_jsx_runtime, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as articles } from "./gemini-BmjONweS.mjs";
import { k as ArrowLeft } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/sfx-DnkSDGqY.js
var import_jsx_runtime = require_jsx_runtime();
function ArticlePicker({ value, onChange, allowAll = true }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
		value,
		onChange: (event) => onChange(event.target.value),
		className: "w-full max-w-md rounded-lg border border-line bg-paper-deep px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-accent",
		children: [allowAll ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
			value: "all",
			children: "十二篇混合題庫"
		}) : null, articles.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
			value: item.id,
			children: item.title
		}, item.id))]
	});
}
function GameChrome({ title, kicker, blurb, picker, hud, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-3xl space-y-5 pb-32",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/games",
				className: "inline-flex items-center gap-2 text-sm text-muted hover:text-accent",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), " 返回闖關"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "rounded-xl border border-line bg-paper-card/95 p-5 shadow-page sm:p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-bold tracking-[0.22em] text-accent",
						children: kicker
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-1 font-serif text-2xl font-bold",
						children: title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm leading-relaxed text-ink-soft",
						children: blurb
					}),
					picker ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4",
						children: picker
					}) : null
				]
			}),
			hud,
			children
		]
	});
}
function HudStat({ label, value, warn }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-line bg-paper-deep/80 px-3 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-[11px] font-semibold tracking-wide text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: `mt-0.5 font-serif text-xl font-bold tabular-nums ${warn ? "text-seal" : "text-ink"}`,
			children: value
		})]
	});
}
var ctx = null;
function unlockSfx() {
	if (typeof window === "undefined") return;
	if (!ctx) ctx = new AudioContext();
	if (ctx.state === "suspended") ctx.resume();
}
function tone(freq, dur = .08, type = "sine", gain = .07) {
	if (!ctx) return;
	const t = ctx.currentTime;
	const osc = ctx.createOscillator();
	const amp = ctx.createGain();
	osc.type = type;
	osc.frequency.setValueAtTime(freq, t);
	amp.gain.setValueAtTime(gain, t);
	amp.gain.exponentialRampToValueAtTime(.001, t + dur);
	osc.connect(amp).connect(ctx.destination);
	osc.start(t);
	osc.stop(t + dur + .02);
}
var sfx = {
	ok() {
		tone(523, .06);
		tone(784, .1);
	},
	bad() {
		tone(196, .16, "square", .045);
	},
	combo() {
		tone(659, .05);
		tone(880, .09);
	},
	flip() {
		tone(420, .04, "triangle", .04);
	},
	win() {
		tone(523, .08);
		tone(659, .1);
		tone(784, .16);
	}
};
//#endregion
export { unlockSfx as a, sfx as i, GameChrome as n, HudStat as r, ArticlePicker as t };
