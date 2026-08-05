export function CompletionBar({
  label,
  filled,
  total,
}: {
  label: string;
  filled: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;

  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-resting">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="font-display text-lg font-bold text-purple">{pct}%</p>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-paper-2"
      >
        <div className="h-full rounded-full bg-purple" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs text-mute">
        {filled} de {total} completados
        {total - filled > 0 && ` · faltan ${total - filled}`}
      </p>
    </div>
  );
}
