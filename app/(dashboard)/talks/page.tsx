import Link from "next/link";
import { getDashboardData } from "@/lib/pretalx";
import { Badge } from "@/components/Badge";
import { StateBadge } from "@/components/StateBadge";
import { FilterSelect } from "@/components/FilterSelect";

// See app/(dashboard)/page.tsx for why this is force-dynamic instead of revalidate.
export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  state?: string;
  type?: string;
  track?: string;
  language?: string;
  coordinator?: string;
}>;

/** Defaults to "confirmed" — that's the actual programa, not the raw CFP queue. */
const STATE_OPTIONS = [
  { value: "confirmed", label: "Confirmadas" },
  { value: "submitted", label: "En revisión" },
  { value: "all", label: "Todas" },
];

const LANGUAGE_LABELS: Record<string, string> = { es: "Español", en: "English" };

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
  const { state, type, track, language, coordinator } = await searchParams;
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
  const coordinators = [
    ...new Set(talks.map((t) => t.coordinator).filter((c): c is string => c !== null)),
  ].sort();

  const activeState = state ?? "confirmed";
  const filtered = talks.filter((s) => {
    const stateMatch = activeState === "all" || s.state === activeState;
    const typeMatch = !type || String(s.submissionTypeId) === type;
    const trackMatch = !track || String(s.trackId) === track;
    const languageMatch = !language || s.language === language;
    const coordinatorMatch = !coordinator || s.coordinator === coordinator;
    return stateMatch && typeMatch && trackMatch && languageMatch && coordinatorMatch;
  });
  const sorted = [...filtered].sort((a, b) => a.title.localeCompare(b.title));

  const exportParams = new URLSearchParams();
  if (activeState !== "confirmed") exportParams.set("state", activeState);
  if (type) exportParams.set("type", type);
  if (track) exportParams.set("track", track);
  if (language) exportParams.set("language", language);
  if (coordinator) exportParams.set("coordinator", coordinator);
  const exportQs = exportParams.toString();
  const exportHref = `/api/export/talks${exportQs ? `?${exportQs}` : ""}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">Charlas</h1>
          <p className="mt-1 text-mute">
            {filtered.length} de {talks.length} submissions.
          </p>
        </div>
        <a
          href={exportHref}
          className="flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-purple hover:text-purple"
        >
          ⬇ Descargar Excel
        </a>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-line bg-white px-4 py-3">
        <FilterSelect label="Estado" paramName="state" value={activeState} defaultValue="confirmed" options={STATE_OPTIONS} />
        <FilterSelect
          label="Tipo"
          paramName="type"
          value={type ?? ""}
          options={[{ value: "", label: "Todos" }, ...talkTypes.map((t) => ({ value: String(t.id), label: t.name }))]}
        />
        <FilterSelect
          label="Track"
          paramName="track"
          value={track ?? ""}
          options={[{ value: "", label: "Todos" }, ...tracks.map((t) => ({ value: String(t.id), label: t.name }))]}
        />
        <FilterSelect
          label="Idioma"
          paramName="language"
          value={language ?? ""}
          options={[
            { value: "", label: "Todos" },
            ...Object.entries(LANGUAGE_LABELS).map(([value, label]) => ({ value, label })),
          ]}
        />
        <FilterSelect
          label="Coordinador"
          paramName="coordinator"
          value={coordinator ?? ""}
          options={[{ value: "", label: "Todos" }, ...coordinators.map((c) => ({ value: c, label: c }))]}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-paper-2 text-mute">
            <tr>
              <th className="px-4 py-3 font-medium">Charla</th>
              <th className="px-4 py-3 font-medium">Speaker(s)</th>
              <th className="px-4 py-3 font-medium">Track</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Idioma</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Horario</th>
              <th className="px-4 py-3 font-medium">Láminas</th>
              <th className="px-4 py-3 font-medium">Coordinador</th>
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
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/talks/${s.code}`} className="text-ink hover:text-purple hover:underline">
                      {s.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-mute">{speakerNames || "—"}</td>
                  <td className="px-4 py-3 text-mute">{track?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={isKeynote ? "purple" : "mute"}>{sType?.name ?? "—"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-mute">{LANGUAGE_LABELS[s.language] ?? s.language}</td>
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
                  <td className="px-4 py-3">
                    {s.slidesUrl ? (
                      <a
                        href={s.slidesUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple hover:underline"
                      >
                        Ver ↗
                      </a>
                    ) : (
                      <Badge tone="warn">Pendiente</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-mute">{s.coordinator ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
