"use client";

import { useState } from "react";
import Link from "next/link";

type Person = { code: string; name: string; avatarUrl: string | null };
type Item = { label: string; count: number; people: Person[] };

export function ExpandableBarList({
  items,
  pageSize = 8,
}: {
  items: Item[];
  pageSize?: number;
}) {
  const [openLabel, setOpenLabel] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const sorted = [...items].sort((a, b) => b.count - a.count);
  const max = sorted[0]?.count ?? 1;
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = sorted.slice(page * pageSize, page * pageSize + pageSize);

  if (sorted.length === 0) {
    return <p className="text-sm text-mute">Sin datos.</p>;
  }

  function goTo(next: number) {
    setPage(Math.max(0, Math.min(totalPages - 1, next)));
    setOpenLabel(null);
  }

  return (
    <div>
      <div>
        {current.map((item) => {
          const isOpen = openLabel === item.label;
          return (
            <div key={item.label} className="border-b border-line py-2 last:border-0">
              <button
                type="button"
                onClick={() => setOpenLabel(isOpen ? null : item.label)}
                aria-expanded={isOpen}
                className="w-full text-left"
              >
                <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium text-ink">{item.label}</span>
                  <span className="shrink-0 text-mute">{item.count}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-paper-2">
                  <div
                    className="h-full rounded-full bg-purple"
                    style={{ width: `${Math.max((item.count / max) * 100, 3)}%` }}
                  />
                </div>
              </button>
              {isOpen && (
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 pl-1">
                  {item.people.map((p) => (
                    <li key={p.code}>
                      <Link
                        href={`/speakers/${p.code}`}
                        className="text-sm text-purple hover:underline"
                      >
                        {p.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
          <button
            type="button"
            onClick={() => goTo(page - 1)}
            disabled={page === 0}
            className="rounded-full border border-line px-3 py-1 text-xs font-medium text-ink transition-colors hover:border-purple disabled:opacity-40 disabled:hover:border-line"
          >
            ← Anterior
          </button>
          <span className="text-xs text-mute">
            {page + 1} / {totalPages} · {sorted.length} en total
          </span>
          <button
            type="button"
            onClick={() => goTo(page + 1)}
            disabled={page === totalPages - 1}
            className="rounded-full border border-line px-3 py-1 text-xs font-medium text-ink transition-colors hover:border-purple disabled:opacity-40 disabled:hover:border-line"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
