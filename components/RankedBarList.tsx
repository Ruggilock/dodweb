export function RankedBarList({
  items,
  maxItems = 12,
}: {
  items: { label: string; count: number }[];
  maxItems?: number;
}) {
  const sorted = [...items].sort((a, b) => b.count - a.count).slice(0, maxItems);
  const max = sorted[0]?.count ?? 1;

  if (sorted.length === 0) {
    return <p className="text-sm text-mute">Sin datos.</p>;
  }

  return (
    <div className="space-y-3">
      {sorted.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
            <span className="font-medium text-ink">{item.label}</span>
            <span className="text-mute">{item.count}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-paper-2">
            <div
              className="h-full rounded-full bg-purple"
              style={{ width: `${Math.max((item.count / max) * 100, 3)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
