const VALUE_TONE = {
  default: "text-ink",
  lime: "text-purple",
} as const;

export function StatCard({
  label,
  value,
  sublabel,
  tone = "default",
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  tone?: keyof typeof VALUE_TONE;
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-6 shadow-resting">
      <p className="text-sm text-mute">{label}</p>
      <p className={`mt-1 font-display text-3xl font-extrabold ${VALUE_TONE[tone]}`}>
        {value}
      </p>
      {sublabel && <p className="mt-1 text-xs text-mute">{sublabel}</p>}
    </div>
  );
}
