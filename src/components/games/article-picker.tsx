import { articles } from "@/data/articles";

export function ArticlePicker({
  value,
  onChange,
  allowAll = true,
}: {
  value: string;
  onChange: (id: string) => void;
  allowAll?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full max-w-md rounded-lg border border-line bg-paper-deep px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-accent"
    >
      {allowAll ? <option value="all">十二篇混合題庫</option> : null}
      {articles.map((item) => (
        <option key={item.id} value={item.id}>
          {item.title}
        </option>
      ))}
    </select>
  );
}
