import Link from "next/link";
import { getDashboardData } from "@/lib/pretalx";
import { Badge } from "@/components/Badge";
import type { SubmissionState } from "@/lib/types";

// See app/(dashboard)/page.tsx for why this is force-dynamic instead of revalidate.
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ state?: string; track?: string; type?: string; view?: string }>;

/** Defaults to "confirmed" — same as /talks, it's the actual programa. */
const STATE_FILTERS: { key: SubmissionState | "all"; label: string }[] = [
  { key: "confirmed", label: "Confirmados" },
  { key: "submitted", label: "En revisión" },
  { key: "all", label: "Todos" },
];

function buildHref(
  current: { state: string; track?: string; type?: string; view: string },
  updates: { state?: string; track?: string; type?: string; view?: string }
) {
  const state = updates.state ?? current.state;
  const track = "track" in updates ? updates.track : current.track;
  const type = "type" in updates ? updates.type : current.type;
  const view = updates.view ?? current.view;
  const params = new URLSearchParams();
  if (state && state !== "confirmed") params.set("state", state);
  if (track) params.set("track", track);
  if (type) params.set("type", type);
  if (view && view !== "grid") params.set("view", view);
  const qs = params.toString();
  return `/speakers${qs ? `?${qs}` : ""}`;
}

export default async function SpeakersPage({ searchParams }: { searchParams: SearchParams }) {
  const { state, track, type, view } = await searchParams;
  const { speakers, submissions, tracks, submissionTypes } = await getDashboardData();

  const submissionByCode = new Map(submissions.map((s) => [s.code, s]));
  const trackById = new Map(tracks.map((t) => [t.id, t]));
  const typeById = new Map(submissionTypes.map((t) => [t.id, t]));
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
    const typeMatch = !type || talks.some((t) => String(t.submissionTypeId) === type);
    return stateMatch && trackMatch && typeMatch;
  });

  const sorted = filtered.sort((a, b) => a.speaker.name.localeCompare(b.speaker.name));
  const activeView = view === "rows" ? "rows" : "grid";
  const current = { state: activeState, track, type, view: activeView };
  const exportParams = new URLSearchParams();
  if (activeState !== "confirmed") exportParams.set("state", activeState);
  if (track) exportParams.set("track", track);
  if (type) exportParams.set("type", type);
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
        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-line bg-white p-1">
            <Link
              href={buildHref(current, { view: "grid" })}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                activeView === "grid" ? "bg-purple text-white" : "text-ink hover:text-purple"
              }`}
            >
              ▦ Tarjetas
            </Link>
            <Link
              href={buildHref(current, { view: "rows" })}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                activeView === "rows" ? "bg-purple text-white" : "text-ink hover:text-purple"
              }`}
            >
              ☰ Filas
            </Link>
          </div>
          <a
            href={exportHref}
            className="flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-purple hover:text-purple"
          >
            ⬇ Descargar CSV
          </a>
        </div>
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

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-mute">Tipo de sesión</span>
          <Link
            href={buildHref(current, { type: undefined })}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              !type
                ? "bg-purple text-white"
                : "border border-line bg-white text-ink hover:border-purple"
            }`}
          >
            Todos
          </Link>
          {submissionTypes.map((t) => (
            <Link
              key={t.id}
              href={buildHref(current, { type: String(t.id) })}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                type === String(t.id)
                  ? "bg-purple text-white"
                  : "border border-line bg-white text-ink hover:border-purple"
              }`}
            >
              {t.name}
            </Link>
          ))}
        </div>
      </div>

      {activeView === "rows" ? (
        <div className="overflow-x-auto rounded-lg border border-line bg-white">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs font-medium uppercase tracking-wide text-mute">
                <th className="px-4 py-3 font-medium">Speaker</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Cargo / Empresa</th>
                <th className="px-4 py-3 font-medium">Ubicación</th>
                <th className="px-4 py-3 font-medium">Charla(s)</th>
                <th className="px-4 py-3 font-medium">Tipo de sesión</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(({ speaker: sp, talks }) => (
                <tr key={sp.code} className="border-b border-line last:border-0 hover:bg-paper-2">
                  <td className="px-4 py-3">
                    <Link
                      href={`/speakers/${sp.code}`}
                      className="flex items-center gap-2.5 font-medium text-ink hover:text-purple"
                    >
                      {sp.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={sp.avatarUrl}
                          alt={sp.name}
                          className="h-8 w-8 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-wash font-display text-xs font-bold text-purple">
                          {sp.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="whitespace-nowrap">{sp.name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-mute">
                    {sp.email ? (
                      <a href={`mailto:${sp.email}`} className="hover:text-purple">
                        {sp.email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-mute">
                    {[sp.jobTitle, sp.company].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-mute">{sp.location || "—"}</td>
                  <td className="px-4 py-3 text-mute">
                    {talks.length > 0
                      ? talks.map((t, i) => (
                          <span key={t.code}>
                            {i > 0 && ", "}
                            {t.title}
                          </span>
                        ))
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {talks.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {talks.map((t) => {
                          const sType = typeById.get(t.submissionTypeId);
                          return (
                            <Badge
                              key={t.code}
                              tone={sType?.name.toLowerCase() === "keynote" ? "purple" : "mute"}
                            >
                              {sType?.name ?? "—"}
                            </Badge>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-mute">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
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
      )}
    </div>
  );
}
