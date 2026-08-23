import { i as __toESM } from "../_runtime.mjs";
import { B as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { _ as Heart, f as Pause, u as Play } from "../_libs/lucide-react.mjs";
import { O as Button, a as Route$3, f as submitScore, k as cn, u as getHighScore, w as useUiStore, x as getVocabChallenges } from "./router-D1ip8uWF.mjs";
import { a as unlockSfx, i as sfx, n as GameChrome, r as HudStat, t as ArticlePicker } from "./sfx-DnkSDGqY.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/games.snake-C76Ooj24.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var COLS = 16;
var ROWS = 14;
var STEP = 1 / 6.2;
var FOOD_COLORS = [
	"#2f5d56",
	"#9c3b32",
	"#4a453c"
];
function opposite(a, b) {
	return a.x + b.x === 0 && a.y + b.y === 0 && (a.x !== 0 || a.y !== 0);
}
function randCell(occupied) {
	for (let i = 0; i < 80; i++) {
		const p = {
			x: 1 + Math.floor(Math.random() * 14),
			y: 1 + Math.floor(Math.random() * 12)
		};
		if (!occupied.some((o) => o.x === p.x && o.y === p.y)) return p;
	}
	return {
		x: 2,
		y: 2
	};
}
function wrap(n, max) {
	return (n + max) % max;
}
function SnakeGame({ initialId }) {
	const [articleId, setArticleId] = (0, import_react.useState)(initialId ?? "all");
	const challenges = (0, import_react.useMemo)(() => getVocabChallenges(articleId), [articleId]);
	const tutorOpen = useUiStore((s) => s.tutorOpen);
	const [phase, setPhase] = (0, import_react.useState)("ready");
	const [score, setScore] = (0, import_react.useState)(0);
	const [lives, setLives] = (0, import_react.useState)(3);
	const [combo, setCombo] = (0, import_react.useState)(0);
	const [high, setHigh] = (0, import_react.useState)(0);
	const [challenge, setChallenge] = (0, import_react.useState)(null);
	const [foods, setFoods] = (0, import_react.useState)([]);
	const [flash, setFlash] = (0, import_react.useState)(null);
	const [paused, setPaused] = (0, import_react.useState)(false);
	const canvasRef = (0, import_react.useRef)(null);
	const wrapRef = (0, import_react.useRef)(null);
	const sim = (0, import_react.useRef)({
		snake: [{
			x: 8,
			y: 7
		}],
		dir: {
			x: 1,
			y: 0
		},
		queued: {
			x: 1,
			y: 0
		},
		acc: 0,
		foods: [],
		challenge: null,
		index: 0,
		lives: 3,
		score: 0,
		combo: 0,
		running: false,
		shake: 0
	});
	const phaseRef = (0, import_react.useRef)(phase);
	phaseRef.current = phase;
	(0, import_react.useEffect)(() => {
		setHigh(getHighScore("snake"));
	}, []);
	const paint = (0, import_react.useCallback)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const cssW = canvas.clientWidth;
		const cssH = canvas.clientHeight;
		if (canvas.width !== Math.floor(cssW * dpr) || canvas.height !== Math.floor(cssH * dpr)) {
			canvas.width = Math.floor(cssW * dpr);
			canvas.height = Math.floor(cssH * dpr);
		}
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		const cell = Math.min(cssW / COLS, cssH / ROWS);
		const ox = (cssW - cell * COLS) / 2;
		const oy = (cssH - cell * ROWS) / 2;
		const s = sim.current;
		const shakeX = s.shake > 0 ? (Math.random() - .5) * s.shake * 10 : 0;
		const shakeY = s.shake > 0 ? (Math.random() - .5) * s.shake * 10 : 0;
		ctx.clearRect(0, 0, cssW, cssH);
		ctx.save();
		ctx.translate(ox + shakeX, oy + shakeY);
		ctx.fillStyle = "rgba(28,25,21,0.04)";
		ctx.fillRect(0, 0, cell * COLS, cell * ROWS);
		ctx.strokeStyle = "rgba(28,25,21,0.06)";
		ctx.lineWidth = 1;
		for (let x = 0; x <= COLS; x++) {
			ctx.beginPath();
			ctx.moveTo(x * cell, 0);
			ctx.lineTo(x * cell, ROWS * cell);
			ctx.stroke();
		}
		for (let y = 0; y <= ROWS; y++) {
			ctx.beginPath();
			ctx.moveTo(0, y * cell);
			ctx.lineTo(COLS * cell, y * cell);
			ctx.stroke();
		}
		for (const food of s.foods) {
			const pad = cell * .16;
			ctx.fillStyle = food.color;
			roundRect(ctx, food.x * cell + pad, food.y * cell + pad, cell - pad * 2, cell - pad * 2, 6);
			ctx.fill();
		}
		s.snake.forEach((seg, i) => {
			const t = i / Math.max(s.snake.length - 1, 1);
			ctx.fillStyle = `rgba(47,93,86,${.45 + (1 - t) * .55})`;
			const pad = i === 0 ? cell * .08 : cell * .18;
			roundRect(ctx, seg.x * cell + pad, seg.y * cell + pad, cell - pad * 2, cell - pad * 2, i === 0 ? 7 : 4);
			ctx.fill();
			if (i === 0) {
				ctx.fillStyle = "#f4efe4";
				const ex = s.dir.x !== 0 ? .22 : .32;
				const ey = s.dir.y !== 0 ? .22 : .32;
				ctx.beginPath();
				ctx.arc(seg.x * cell + cell * (.5 - ex), seg.y * cell + cell * (.5 - ey), cell * .08, 0, Math.PI * 2);
				ctx.arc(seg.x * cell + cell * (.5 + ex * .2), seg.y * cell + cell * (.5 - ey), cell * .08, 0, Math.PI * 2);
				ctx.fill();
			}
		});
		ctx.restore();
	}, []);
	const spawnQuestion = (0, import_react.useCallback)(() => {
		const s = sim.current;
		if (challenges.length === 0) return;
		const item = challenges[s.index % challenges.length];
		s.index += 1;
		s.challenge = item;
		const occupied = [...s.snake];
		s.foods = shuffleStable([item.meaning, ...item.distractors]).slice(0, 3).map((meaning, i) => {
			const pos = randCell(occupied);
			occupied.push(pos);
			return {
				...pos,
				meaning,
				correct: meaning === item.meaning,
				color: FOOD_COLORS[i % FOOD_COLORS.length]
			};
		});
		setChallenge(item);
		setFoods(s.foods);
	}, [challenges]);
	const endGame = (0, import_react.useCallback)(() => {
		const s = sim.current;
		s.running = false;
		setPhase("over");
		const result = submitScore("snake", s.score);
		setHigh(result.high);
		sfx.bad();
	}, []);
	const hurt = (0, import_react.useCallback)((kind) => {
		const s = sim.current;
		s.lives -= 1;
		s.combo = 0;
		s.shake = 1;
		setLives(s.lives);
		setCombo(0);
		setFlash("bad");
		sfx.bad();
		if (kind === "wrong" && s.snake.length > 3) s.snake.pop();
		if (s.lives <= 0) {
			endGame();
			return;
		}
		spawnQuestion();
	}, [endGame, spawnQuestion]);
	const start = (0, import_react.useCallback)(() => {
		unlockSfx();
		const s = sim.current;
		s.snake = [
			{
				x: 8,
				y: 7
			},
			{
				x: 7,
				y: 7
			},
			{
				x: 6,
				y: 7
			}
		];
		s.dir = {
			x: 1,
			y: 0
		};
		s.queued = {
			x: 1,
			y: 0
		};
		s.acc = 0;
		s.index = 0;
		s.lives = 3;
		s.score = 0;
		s.combo = 0;
		s.running = true;
		s.shake = 0;
		setScore(0);
		setLives(3);
		setCombo(0);
		setFlash(null);
		setPaused(false);
		setPhase("play");
		spawnQuestion();
	}, [spawnQuestion]);
	(0, import_react.useEffect)(() => {
		if (phase !== "play") return;
		let raf = 0;
		let last = performance.now();
		const tick = (now) => {
			raf = requestAnimationFrame(tick);
			const dt = Math.min(.1, (now - last) / 1e3);
			last = now;
			const s = sim.current;
			if (!s.running || paused || tutorOpen) {
				paint();
				return;
			}
			s.shake = Math.max(0, s.shake - dt * 3);
			s.acc += dt;
			const interval = Math.max(.09, STEP - s.combo * .006);
			while (s.acc >= interval) {
				s.acc -= interval;
				if (!opposite(s.dir, s.queued)) s.dir = s.queued;
				const head = s.snake[0];
				const next = {
					x: wrap(head.x + s.dir.x, COLS),
					y: wrap(head.y + s.dir.y, ROWS)
				};
				if (s.snake.some((seg) => seg.x === next.x && seg.y === next.y)) {
					hurt("self");
					break;
				}
				s.snake.unshift(next);
				const eaten = s.foods.find((food) => food.x === next.x && food.y === next.y);
				if (eaten) {
					if (eaten.correct) {
						s.combo += 1;
						s.score += 10 + Math.min(s.combo, 8) * 2;
						setScore(s.score);
						setCombo(s.combo);
						setFlash("ok");
						if (s.combo >= 3) sfx.combo();
						else sfx.ok();
						spawnQuestion();
					} else {
						s.snake.shift();
						hurt("wrong");
						break;
					}
				} else s.snake.pop();
			}
			paint();
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [
		phase,
		paused,
		tutorOpen,
		paint,
		hurt,
		spawnQuestion
	]);
	(0, import_react.useEffect)(() => {
		const onKey = (event) => {
			if (phaseRef.current !== "play") return;
			const next = {
				ArrowUp: {
					x: 0,
					y: -1
				},
				ArrowDown: {
					x: 0,
					y: 1
				},
				ArrowLeft: {
					x: -1,
					y: 0
				},
				ArrowRight: {
					x: 1,
					y: 0
				},
				KeyW: {
					x: 0,
					y: -1
				},
				KeyS: {
					x: 0,
					y: 1
				},
				KeyA: {
					x: -1,
					y: 0
				},
				KeyD: {
					x: 1,
					y: 0
				}
			}[event.code];
			if (!next) return;
			event.preventDefault();
			if (!opposite(sim.current.dir, next)) sim.current.queued = next;
		};
		const onBlur = () => {
			sim.current.queued = sim.current.dir;
		};
		window.addEventListener("keydown", onKey);
		window.addEventListener("blur", onBlur);
		return () => {
			window.removeEventListener("keydown", onKey);
			window.removeEventListener("blur", onBlur);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		const el = wrapRef.current;
		if (!el) return;
		let sx = 0;
		let sy = 0;
		const down = (e) => {
			sx = e.clientX;
			sy = e.clientY;
		};
		const up = (e) => {
			const dx = e.clientX - sx;
			const dy = e.clientY - sy;
			if (Math.hypot(dx, dy) < 28) return;
			const next = Math.abs(dx) > Math.abs(dy) ? {
				x: dx > 0 ? 1 : -1,
				y: 0
			} : {
				x: 0,
				y: dy > 0 ? 1 : -1
			};
			if (!opposite(sim.current.dir, next)) sim.current.queued = next;
		};
		el.addEventListener("pointerdown", down);
		el.addEventListener("pointerup", up);
		return () => {
			el.removeEventListener("pointerdown", down);
			el.removeEventListener("pointerup", up);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (!flash) return;
		const t = window.setTimeout(() => setFlash(null), 420);
		return () => window.clearTimeout(t);
	}, [flash]);
	function steer(next) {
		if (!opposite(sim.current.dir, next)) sim.current.queued = next;
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GameChrome, {
		title: "詞解貪食蛇",
		kicker: "直覺反應",
		blurb: "畫面中央是重點字。地圖上同時出現兩到三個解釋，只吃正確的那一個。方向鍵或 WASD，手機可滑動或用下方十字。",
		picker: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArticlePicker, {
			value: articleId,
			onChange: (id) => {
				setArticleId(id);
				setPhase("ready");
				sim.current.running = false;
			}
		}),
		hud: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-4 gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HudStat, {
					label: "分數",
					value: score
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HudStat, {
					label: "連擊",
					value: combo
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HudStat, {
					label: "最高",
					value: high
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-lg border border-line bg-paper-deep/80 px-3 py-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[11px] font-semibold tracking-wide text-muted",
						children: "生命"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 flex gap-1",
						children: Array.from({ length: 3 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: cn("size-5", i < lives ? "fill-seal text-seal" : "text-line") }, i))
					})]
				})
			]
		}),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "overflow-hidden rounded-xl border border-line bg-paper-card shadow-page",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "border-b border-line px-4 py-3 text-center",
					children: challenge ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-serif text-3xl font-extrabold text-accent",
						children: challenge.word
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs leading-relaxed text-muted",
						children: challenge.quote
					})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-serif text-lg text-muted",
						children: "準備吞噬正確詞義"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					ref: wrapRef,
					className: "relative",
					style: { touchAction: "none" },
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
							ref: canvasRef,
							className: "block h-[300px] w-full bg-paper-deep/40 sm:h-[min(52vw,420px)]"
						}),
						phase !== "play" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "absolute inset-0 flex flex-col items-center justify-center gap-3 bg-paper/80 p-6 text-center backdrop-blur-[2px]",
							children: phase === "over" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-serif text-2xl font-bold",
									children: "墨盡了"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm text-ink-soft",
									children: [
										"本局 ",
										score,
										" 分",
										high === score && score > 0 ? " · 新高分" : ""
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									onClick: start,
									children: "再來一局"
								})
							] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-serif text-2xl font-bold",
									children: "點擊開始"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "max-w-sm text-sm text-ink-soft",
									children: "吃對變長加分，吃錯或咬到自己扣一顆心。"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									onClick: start,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4" }), " 開始"]
								})
							] })
						}) : null,
						flash ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("pointer-events-none absolute inset-0 mix-blend-multiply", flash === "ok" ? "bg-ok/15" : "bg-seal/20") }) : null
					]
				}),
				foods.length > 0 && phase === "play" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "grid grid-cols-1 gap-2 border-t border-line p-3 sm:grid-cols-3",
					children: foods.map((food) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-2 rounded-md bg-paper-deep px-3 py-2 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "size-3 shrink-0 rounded-sm",
							style: { background: food.color }
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "leading-snug text-ink-soft",
							children: food.meaning
						})]
					}, food.meaning))
				}) : null
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "outline",
					size: "sm",
					onClick: () => setPaused((v) => !v),
					disabled: phase !== "play",
					children: [paused ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-4" }), paused ? "繼續" : "暫停"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-3 gap-1 sm:hidden",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pad, {
							onPress: () => steer({
								x: 0,
								y: -1
							}),
							children: "上"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pad, {
							onPress: () => steer({
								x: -1,
								y: 0
							}),
							children: "左"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pad, {
							onPress: () => steer({
								x: 0,
								y: 1
							}),
							children: "下"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pad, {
							onPress: () => steer({
								x: 1,
								y: 0
							}),
							children: "右"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "hidden text-xs text-muted sm:block",
					children: "方向鍵／WASD · 邊界會穿越"
				})
			]
		})]
	});
}
function Pad({ children, onPress }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onPointerDown: (event) => {
			event.preventDefault();
			onPress();
		},
		className: "flex size-12 items-center justify-center rounded-md border border-line bg-paper-card text-sm font-bold text-ink",
		children
	});
}
function roundRect(ctx, x, y, w, h, r) {
	const radius = Math.min(r, w / 2, h / 2);
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.arcTo(x + w, y, x + w, y + h, radius);
	ctx.arcTo(x + w, y + h, x, y + h, radius);
	ctx.arcTo(x, y + h, x, y, radius);
	ctx.arcTo(x, y, x + w, y, radius);
	ctx.closePath();
}
function shuffleStable(items) {
	const next = [...items];
	for (let i = next.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[next[i], next[j]] = [next[j], next[i]];
	}
	return next;
}
function SnakeRoute() {
	const { id } = Route$3.useSearch();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SnakeGame, { initialId: id });
}
//#endregion
export { SnakeRoute as component };
