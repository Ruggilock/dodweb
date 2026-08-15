"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Excel-style dropdown filter: reads/writes a single query param, preserving
 * whatever else is in the URL. Omits the param entirely when it's set back
 * to `defaultValue` (or ""), so the URL stays clean for the common case. */
export function FilterSelect({
  label,
  paramName,
  value,
  defaultValue = "",
  options,
}: {
  label: string;
  paramName: string;
  value: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (next === defaultValue) {
      params.delete(paramName);
    } else {
      params.set(paramName, next);
    }
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  }

  return (
    <label className="flex items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-mute">{label}</span>
      <select
        value={value}
        onChange={handleChange}
        className="rounded-full border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-purple focus:border-purple focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
