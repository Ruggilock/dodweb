import Link from "next/link";
import { getDashboardData } from "@/lib/pretalx";
import type { SubmissionState } from "@/lib/types";

// See app/(dashboard)/page.tsx for why this is force-dynamic instead of revalidate.
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ state?: string; track?: string }>;

/** Defaults to "confirmed" — same as /talks, it's the actual programa. */
const STATE_FILTERS: { key: SubmissionState | "all"; label: string }[] = [
  { key: "confirmed", label: "Confirmados" },
  { key: "submitted", label: "En revisión" },
  { key: "all", label: "Todos" },
];

function buildHref(current: { state: string; track?: string }, updates: { state?: string; track?: string }) {
  const state = updates.state ?? current.state;
  const track = "track" in updates ? updates.track : current.track;
  const params = new URLSearchParams();
  if (state && state !== "confirmed") params.set("state", state);
  if (track) params.set("track", track);
  const qs = params.toString();
  return `/speakers${qs ? `?${qs}` : ""}`;
}

export default async function SpeakersPage({ searchParams }: { searchParams: SearchParams }) {
  const { state, track } = await searchParams;
  const { speakers, submissions, tracks } = await getDashboardData();

  const submissionByCode = new Map(submissions.map((s) => [s.code, s]));
  const trackById = new Map(tracks.map((t) => [t.id, t]));
  const activeState = state ?? "confirmed";

  const withTalks = speakers.map((sp) => ({
    speaker: sp,
    talks: sp.submissionCodes
      .map((c) => submissionByCode.get(c))
      .filter((t) => t !== undefined),
  }));

  const filtered = withTalks.filter(({ talks }) => {
    const stateMatch = activeState === "all" || talks.some((t) => t.state === activeState);
    const trackMatch = !track || talks.some((t) => String(t.trackId) === track);
    return stateMatch && trackMatch;
  });

  const sorted = filtered.sort((a, b) => a.speaker.name.localeCompare(b.speaker.name));
  const current = { state: activeState, track };
  const exportParams = new URLSearchParams();
  if (activeState !== "confirmed") exportParams.set("state", activeState);
  if (track) exportParams.set("track", track);
  const exportQs = exportParams.toString();
  const exportHref = `/api/export/speakers${exportQs ? `?${exportQs}` : ""}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">Speakers</h1>
          <p className="mt-1 text-mute">
            {sorted.length} de {speakers.length} speakers registrados.
          </p>
        </div>
        <a
          href={exportHref}
          className="flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-purple hover:text-purple"
        >
          ⬇ Descargar CSV
        </a>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-mute">Estado</span>
          {STATE_FILTERS.map((f) => (
            <Link
              key={f.key}
              href={buildHref(current, { state: f.key })}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeState === f.key
                  ? "bg-purple text-white"
                  : "border border-line bg-white text-ink hover:border-purple"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-mute">Track</span>
          <Link
            href={buildHref(current, { track: undefined })}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              !track
                ? "bg-purple text-white"
                : "border border-line bg-white text-ink hover:border-purple"
            }`}
          >
            Todos
          </Link>
          {tracks.map((t) => (
            <Link
              key={t.id}
              href={buildHref(current, { track: String(t.id) })}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                track === String(t.id)
                  ? "bg-purple text-white"
                  : "border border-line bg-white text-ink hover:border-purple"
              }`}
            >
              {t.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map(({ speaker: sp, talks }) => (
          <Link
            key={sp.code}
            href={`/speakers/${sp.code}`}
            className="block rounded-lg border border-line bg-white p-5 shadow-resting transition-shadow hover:shadow-hover"
          >
            <div className="flex items-center gap-3">
              {sp.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sp.avatarUrl}
                  alt={sp.name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-wash font-display text-sm font-bold text-purple">
                  {sp.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{sp.name}</p>
                {(sp.jobTitle || sp.company) && (
                  <p className="truncate text-xs text-mute">
                    {[sp.jobTitle, sp.company].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            </div>

            {sp.location && <p className="mt-3 text-xs text-mute">📍 {sp.location}</p>}

            {talks.length > 0 && (
              <ul className="mt-3 space-y-1 border-t border-line pt-3">
                {talks.map((t) => (
                  <li key={t.code} className="text-sm text-ink">
                    {t.title}
                    {t.trackId && trackById.get(t.trackId) && (
                      <span className="ml-1 text-xs text-mute">
                        · {trackById.get(t.trackId)!.name}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
