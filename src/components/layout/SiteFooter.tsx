/**
 * 製作者署名。
 *
 * 底部留了額外的 padding：AI 助教是 `fixed bottom-5 right-4` 的浮動按鈕
 * （見 `TutorDock`），沒有這段留白的話，捲到頁尾時署名會被它蓋住。
 */
export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-line/70">
      <div className="mx-auto max-w-5xl px-4 pb-20 pt-6 text-center sm:px-8 sm:pb-8 lg:px-6">
        <p className="text-xs leading-relaxed text-muted">
          <span className="font-serif font-bold tracking-wide text-ink-soft">KCSS</span>{" "}
          林凱盛、蔡鎮源、黃子濤同學製作
        </p>
      </div>
    </footer>
  );
}
