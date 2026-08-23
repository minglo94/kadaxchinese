import { useEffect, useState } from "react";
import { BambooGrove } from "./BambooGrove";
import { BrushTrail } from "./BrushTrail";

function useMedia(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

function useScrollProgress(reduced: boolean) {
  const [progress, setProgress] = useState(reduced ? 0.62 : 0);

  useEffect(() => {
    if (reduced) {
      setProgress(0.62);
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

export function InkStage({ paused }: { paused?: boolean }) {
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  const compact = useMedia("(max-width: 720px)");
  const finePointer = useMedia("(pointer: fine)");
  const dark = useMedia("(prefers-color-scheme: dark)");
  const [isDark, setIsDark] = useState(false);
  const progress = useScrollProgress(reduced);

  useEffect(() => {
    const sync = () => setIsDark(document.documentElement.classList.contains("dark"));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  return (
    <div id="ink-stage" className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 text-ink">
        <BambooGrove progress={progress} reduced={reduced} compact={compact} />
      </div>
      <BrushTrail enabled={!paused && !reduced && finePointer} dark={isDark || dark} />
    </div>
  );
}
