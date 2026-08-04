"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await fetch("/api/refresh", { method: "POST" });
    setLoading(false);
    startTransition(() => router.refresh());
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading || pending}
      className="rounded-full border border-line px-4 py-2 text-sm font-medium text-mute transition-colors hover:border-purple hover:text-purple disabled:opacity-50"
    >
      {loading || pending ? "Actualizando…" : "Refrescar"}
    </button>
  );
}
