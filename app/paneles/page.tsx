import Link from "next/link";
import { getDashboardData } from "@/lib/pretalx";

// See app/(dashboard)/page.tsx for why this is force-dynamic instead of revalidate.
export const dynamic = "force-dynamic";

function formatSlot(start: string, roomName: string | null) {
  const date = new Date(start).toLocaleString("es-PE", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Lima",
  });
  return { date, roomName };
}

export default async function PanelesIndexPage() {
  const { submissions, speakers, tracks, submissionTypes } = await getDashboardData();
  const typeById = new Map(submissionTypes.map((t) => [t.id, t]));
  const trackById = new Map(tracks.map((t) => [t.id, t]));
  const speakerByCode = new Map(speakers.map((s) => [s.code, s]));

  const panels = submissions
    .filter(
      (s) => s.state === "confirmed" && typeById.get(s.submissionTypeId)?.name.toLowerCase() === "panel"
    )
    .sort((a, b) => (a.slot?.start ?? "").localeCompare(b.slot?.start ?? ""));

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Backings de paneles</h1>
          <p className="mt-1 text-sm text-mute">
            Abre el link del panel en pantalla completa en la pantalla del venue.
          </p>
        </div>
        <Link href="/" className="text-sm text-mute hover:text-purple">
          ← Dashboard
        </Link>
      </div>

      <ul className="space-y-3">
        {panels.map((p) => {
          const track = p.trackId ? trackById.get(p.trackId) : null;
          const panelistNames = p.speakerCodes
            .map((c) => speakerByCode.get(c)?.name)
            .filter(Boolean)
            .join(", ");
          const slot = p.slot?.start ? formatSlot(p.slot.start, p.slot.roomName) : null;

          return (
            <li key={p.code} className="rounded-lg border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-ink">{p.title}</p>
                  <p className="mt-1 text-sm text-mute">
                    {track?.name} {panelistNames && `· ${panelistNames}`}
                  </p>
                  {slot && (
                    <p className="mt-1 text-xs text-mute">
                      {slot.date} · {slot.roomName}
                    </p>
                  )}
                </div>
                <Link
                  href={`/paneles/${p.code}`}
                  target="_blank"
                  className="shrink-0 rounded-full bg-purple px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-deep"
                >
                  Abrir backing ↗
                </Link>
              </div>
            </li>
          );
        })}
        {panels.length === 0 && <p className="text-sm text-mute">No hay paneles confirmados.</p>}
      </ul>
    </div>
  );
}
