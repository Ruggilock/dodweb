import { getDashboardData } from "@/lib/pretalx";
import { StatCard } from "@/components/StatCard";

export const revalidate = 300;

export default async function OverviewPage() {
  const { submissions, speakers, tracks, submissionTypes } = await getDashboardData();

  const byState = submissions.reduce<Record<string, number>>((acc, s) => {
    acc[s.state] = (acc[s.state] ?? 0) + 1;
    return acc;
  }, {});

  const byType = submissionTypes
    .map((t) => ({
      ...t,
      count: submissions.filter((s) => s.submissionTypeId === t.id).length,
      confirmed: submissions.filter(
        (s) => s.submissionTypeId === t.id && s.state === "confirmed"
      ).length,
    }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);

  const byTrack = tracks
    .map((t) => ({
      ...t,
      count: submissions.filter((s) => s.trackId === t.id).length,
    }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-ink">Overview</h1>
        <p className="mt-1 text-mute">
          Estado del CFP y la agenda de DevOpsDays Lima 2026.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Speakers" value={speakers.length} />
        <StatCard label="Charlas" value={submissions.length} />
        <StatCard label="Confirmadas" value={byState.confirmed ?? 0} tone="lime" />
        <StatCard label="En revisión" value={byState.submitted ?? 0} />
      </div>

      <section>
        <h2 className="mb-4 font-display text-lg font-bold text-ink">
          Por tipo de sesión
        </h2>
        <div className="overflow-x-auto rounded-lg border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper-2 text-mute">
              <tr>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Duración</th>
                <th className="px-4 py-3 font-medium">Confirmadas</th>
                <th className="px-4 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {byType.map((t) => (
                <tr key={t.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{t.name}</td>
                  <td className="px-4 py-3 text-mute">{t.durationMinutes} min</td>
                  <td className="px-4 py-3 text-ink">{t.confirmed}</td>
                  <td className="px-4 py-3 text-ink">{t.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg font-bold text-ink">Por track</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {byTrack.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-lg border border-line bg-white px-4 py-3"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-ink">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: t.color ?? "#8A8496" }}
                />
                {t.name}
              </span>
              <span className="text-sm text-mute">{t.count}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
