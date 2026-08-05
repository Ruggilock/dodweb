import Link from "next/link";
import { getDashboardData } from "@/lib/pretalx";
import { Badge } from "@/components/Badge";
import { StateBadge } from "@/components/StateBadge";
import type { SubmissionState } from "@/lib/types";

// See app/(dashboard)/page.tsx for why this is force-dynamic instead of revalidate.
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ state?: string; type?: string }>;

/** Defaults to "confirmed" — that's the actual programa, not the raw CFP queue. */
const STATE_FILTERS: { key: SubmissionState | "all"; label: string }[] = [
  { key: "confirmed", label: "Confirmadas" },
  { key: "submitted", label: "En revisión" },
  { key: "all", label: "Todas" },
];

function buildHref(current: { state: string; type?: string }, updates: { state?: string; type?: string }) {
  const state = updates.state ?? current.state;
  const type = "type" in updates ? updates.type : current.type;
  const params = new URLSearchParams();
  if (state && state !== "confirmed") params.set("state", state);
  if (type) params.set("type", type);
  const qs = params.toString();
  return `/talks${qs ? `?${qs}` : ""}`;
}

function formatSlot(start: string, roomName: string | null) {
  const date = new Date(start).toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Lima",
  });
  return { date, roomName };
}

export default async function TalksPage({ searchParams }: { searchParams: SearchParams }) {
  const { state, type } = await searchParams;
  const { submissions, speakers, tracks, submissionTypes } = await getDashboardData();

  const speakerByCode = new Map(speakers.map((s) => [s.code, s]));
  const trackById = new Map(tracks.map((t) => [t.id, t]));
  const typeById = new Map(submissionTypes.map((t) => [t.id, t]));

  // "Event" is program filler (registro, bienvenida, almuerzo, cierre) — not a
  // speaker talk, so it's excluded here and only shown in /agenda.
  const talks = submissions.filter(
    (s) => typeById.get(s.submissionTypeId)?.name.toLowerCase() !== "event"
  );
  const talkTypes = submissionTypes.filter((t) => t.name.toLowerCase() !== "event");

  const activeState = state ?? "confirmed";
  const byState = activeState === "all" ? talks : talks.filter((s) => s.state === activeState);
  const filtered = type ? byState.filter((s) => String(s.submissionTypeId) === type) : byState;
  const sorted = [...filtered].sort((a, b) => a.title.localeCompare(b.title));
  const current = { state: activeState, type };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-ink">Charlas</h1>
        <p className="mt-1 text-mute">
          {filtered.length} de {talks.length} submissions.
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
          <span className="text-xs font-medium uppercase tracking-wide text-mute">Tipo</span>
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
          {talkTypes.map((t) => (
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

      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-paper-2 text-mute">
            <tr>
              <th className="px-4 py-3 font-medium">Charla</th>
              <th className="px-4 py-3 font-medium">Speaker(s)</th>
              <th className="px-4 py-3 font-medium">Track</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Horario</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => {
              const track = s.trackId ? trackById.get(s.trackId) : null;
              const sType = typeById.get(s.submissionTypeId);
              const speakerNames = s.speakerCodes
                .map((c) => speakerByCode.get(c)?.name)
                .filter(Boolean)
                .join(", ");
              const slot = s.slot?.start ? formatSlot(s.slot.start, s.slot.roomName) : null;
              const isKeynote = sType?.name.toLowerCase() === "keynote";

              return (
                <tr key={s.code} className="border-b border-line align-top last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{s.title}</td>
                  <td className="px-4 py-3 text-mute">{speakerNames || "—"}</td>
                  <td className="px-4 py-3 text-mute">{track?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={isKeynote ? "purple" : "mute"}>{sType?.name ?? "—"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <StateBadge state={s.state} />
                  </td>
                  <td className="px-4 py-3 text-mute">
                    {slot ? (
                      <>
                        {slot.date}
                        <br />
                        <span className="text-xs">{slot.roomName}</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
