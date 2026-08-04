import { getDashboardData } from "@/lib/pretalx";

export const revalidate = 300;

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Lima",
  });
}

function formatDay(day: string) {
  return new Date(`${day}T12:00:00-05:00`).toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Lima",
  });
}

export default async function AgendaPage() {
  const { submissions, speakers, tracks } = await getDashboardData();
  const speakerByCode = new Map(speakers.map((s) => [s.code, s]));
  const trackById = new Map(tracks.map((t) => [t.id, t]));

  const scheduled = submissions.filter((s) => s.slot?.start && s.slot.day);
  const days = Array.from(new Set(scheduled.map((s) => s.slot!.day!))).sort();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-ink">Agenda</h1>
        <p className="mt-1 text-mute">{scheduled.length} sesiones programadas.</p>
      </div>

      {days.map((day) => {
        const dayItems = scheduled
          .filter((s) => s.slot!.day === day)
          .sort((a, b) => a.slot!.start!.localeCompare(b.slot!.start!));

        return (
          <section key={day}>
            <h2 className="mb-4 font-display text-xl font-bold capitalize text-ink">
              {formatDay(day)}
            </h2>
            <div className="space-y-2">
              {dayItems.map((s) => {
                const track = s.trackId ? trackById.get(s.trackId) : null;
                const speakerNames = s.speakerCodes
                  .map((c) => speakerByCode.get(c)?.name)
                  .filter(Boolean)
                  .join(", ");

                return (
                  <div
                    key={s.code}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 sm:flex-nowrap sm:gap-4"
                  >
                    <div className="w-20 shrink-0 font-mono text-sm text-purple">
                      {formatTime(s.slot!.start!)}
                    </div>
                    <div className="w-28 shrink-0 text-xs text-mute">{s.slot!.roomName}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">{s.title}</p>
                      {speakerNames && (
                        <p className="truncate text-xs text-mute">{speakerNames}</p>
                      )}
                    </div>
                    {track && (
                      <span className="hidden shrink-0 items-center gap-1.5 text-xs text-mute sm:flex">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: track.color ?? "#8A8496" }}
                        />
                        {track.name}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
