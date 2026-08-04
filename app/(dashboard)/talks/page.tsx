import Link from "next/link";
import { getDashboardData } from "@/lib/pretalx";
import { Badge } from "@/components/Badge";
import { StateBadge } from "@/components/StateBadge";
import type { SubmissionState } from "@/lib/types";

export const revalidate = 300;

type SearchParams = Promise<{ state?: string }>;

/** Defaults to "confirmed" — that's the actual programa, not the raw CFP queue. */
const FILTERS: { key: SubmissionState | "all"; label: string; href: string }[] = [
  { key: "confirmed", label: "Confirmadas", href: "/talks" },
  { key: "submitted", label: "En revisión", href: "/talks?state=submitted" },
  { key: "all", label: "Todas", href: "/talks?state=all" },
];

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
  const { state } = await searchParams;
  const { submissions, speakers, tracks, submissionTypes } = await getDashboardData();

  const speakerByCode = new Map(speakers.map((s) => [s.code, s]));
  const trackById = new Map(tracks.map((t) => [t.id, t]));
  const typeById = new Map(submissionTypes.map((t) => [t.id, t]));

  // "Event" is program filler (registro, bienvenida, almuerzo, cierre) — not a
  // speaker talk, so it's excluded here and only shown in /agenda.
  const talks = submissions.filter(
    (s) => typeById.get(s.submissionTypeId)?.name.toLowerCase() !== "event"
  );
  const activeState = state ?? "confirmed";
  const filtered = activeState === "all" ? talks : talks.filter((s) => s.state === activeState);
  const sorted = [...filtered].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-ink">Charlas</h1>
        <p className="mt-1 text-mute">
          {filtered.length} de {talks.length} submissions.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.href}
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
              const type = typeById.get(s.submissionTypeId);
              const speakerNames = s.speakerCodes
                .map((c) => speakerByCode.get(c)?.name)
                .filter(Boolean)
                .join(", ");
              const slot = s.slot?.start ? formatSlot(s.slot.start, s.slot.roomName) : null;
              const isKeynote = type?.name.toLowerCase() === "keynote";

              return (
                <tr key={s.code} className="border-b border-line align-top last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{s.title}</td>
                  <td className="px-4 py-3 text-mute">{speakerNames || "—"}</td>
                  <td className="px-4 py-3 text-mute">{track?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={isKeynote ? "purple" : "mute"}>{type?.name ?? "—"}</Badge>
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
