import { notFound } from "next/navigation";
import { getDashboardData } from "@/lib/pretalx";

// See app/(dashboard)/page.tsx for why this is force-dynamic instead of revalidate.
export const dynamic = "force-dynamic";

type Params = Promise<{ code: string }>;

/** Short single-line teaser from the (often multi-paragraph) abstract —
 * a stage backdrop needs to be read in a few seconds, not the full CFP text. */
function teaser(abstract: string, maxLength = 220): string {
  const firstParagraph = abstract.split("\n").find((p) => p.trim().length > 0) ?? "";
  if (firstParagraph.length <= maxLength) return firstParagraph;
  const cut = firstParagraph.slice(0, maxLength);
  return cut.slice(0, cut.lastIndexOf(" ")) + "…";
}

export default async function PanelBackingPage({ params }: { params: Params }) {
  const { code } = await params;
  const { submissions, speakers, tracks } = await getDashboardData();

  const talk = submissions.find((s) => s.code === code);
  if (!talk) notFound();

  const track = talk.trackId ? tracks.find((t) => t.id === talk.trackId) : null;
  const panelists = talk.speakerCodes
    .map((c) => speakers.find((s) => s.code === c))
    .filter((s) => s !== undefined);

  // Cap avatar size so 2 panelists don't look as sparse as 5 fill the row.
  const avatarSize = panelists.length <= 3 ? "w-64 h-64" : panelists.length === 4 ? "w-56 h-56" : "w-48 h-48";

  const schedule = talk.slot?.start
    ? new Date(talk.slot.start).toLocaleString("es-PE", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Lima",
      })
    : null;

  return (
    <div className="relative flex h-screen w-screen flex-col justify-between overflow-hidden bg-purple-ink px-20 py-14">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(83,9,158,0.55) 0%, rgba(26,10,54,0) 100%)",
        }}
      />

      <div className="relative text-center">
        <div className="flex items-center justify-center gap-3">
          <span className="font-mono text-xl font-medium tracking-[0.2em] text-purple-tint">
            DEVOPSDAYS LIMA 2026
          </span>
          {track && (
            <span className="rounded-full bg-lime-soft px-4 py-1 font-mono text-lg font-medium text-purple-deep">
              {track.name}
            </span>
          )}
        </div>

        <h1 className="mx-auto mt-8 max-w-6xl font-display text-6xl font-extrabold leading-tight text-paper">
          {talk.title}
        </h1>

        {talk.abstract && (
          <p className="mx-auto mt-6 max-w-4xl text-2xl leading-relaxed text-purple-tint">
            {teaser(talk.abstract)}
          </p>
        )}
      </div>

      <div className="relative flex items-center justify-center gap-16">
        {panelists.map((sp) => (
          <div key={sp.code} className="flex flex-col items-center gap-5 text-center">
            {sp.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sp.avatarUrl}
                alt={sp.name}
                className={`${avatarSize} rounded-full border-4 border-purple-tint/50 object-cover`}
              />
            ) : (
              <div
                className={`flex ${avatarSize} shrink-0 items-center justify-center rounded-full border-4 border-purple-tint/50 bg-lime-soft font-display text-4xl font-bold text-purple-deep`}
              >
                {sp.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-display text-2xl font-bold text-paper">{sp.name}</p>
              {(sp.jobTitle || sp.company) && (
                <p className="mt-1 max-w-xs text-lg text-purple-tint">
                  {[sp.jobTitle, sp.company].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          </div>
        ))}
        {panelists.length === 0 && (
          <p className="text-2xl text-purple-tint">Sin panelistas asignados.</p>
        )}
      </div>

      <div className="relative flex items-center justify-center gap-4 font-mono text-xl text-purple-tint">
        {schedule && <span className="capitalize">{schedule}</span>}
        {schedule && talk.slot?.roomName && <span>·</span>}
        {talk.slot?.roomName && <span>{talk.slot.roomName}</span>}
      </div>
    </div>
  );
}
