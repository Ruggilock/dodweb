import Link from "next/link";
import { getDashboardData } from "@/lib/pretalx";
import type { SubmissionState } from "@/lib/types";

export const revalidate = 300;

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-ink">Speakers</h1>
        <p className="mt-1 text-mute">
          {sorted.length} de {speakers.length} speakers registrados.
        </p>
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
          <div
            key={sp.code}
            className="rounded-lg border border-line bg-white p-5 shadow-resting"
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

            {(sp.linkedin || sp.social) && (
              <div className="mt-3 flex gap-3 border-t border-line pt-3 text-xs">
                {sp.linkedin && (
                  <a
                    href={sp.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple hover:underline"
                  >
                    LinkedIn
                  </a>
                )}
                {sp.social && (
                  <a
                    href={sp.social}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple hover:underline"
                  >
                    Redes
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
