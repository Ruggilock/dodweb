import { notFound } from "next/navigation";
import { getDashboardData } from "@/lib/pretalx";

// See app/(dashboard)/page.tsx for why this is force-dynamic instead of revalidate.
export const dynamic = "force-dynamic";

type Params = Promise<{ code: string }>;

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
  const avatarSize = panelists.length <= 3 ? "w-56 h-56" : panelists.length === 4 ? "w-48 h-48" : "w-40 h-40";

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-purple-ink px-20 py-16">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(83,9,158,0.55) 0%, rgba(26,10,54,0) 100%)",
        }}
      />

      <div className="relative flex items-center justify-center gap-3">
        <span className="font-mono text-xl font-medium tracking-[0.2em] text-purple-tint">
          DEVOPSDAYS LIMA 2026
        </span>
        {track && (
          <span className="rounded-full bg-lime-soft px-4 py-1 font-mono text-lg font-medium text-purple-deep">
            {track.name}
          </span>
        )}
      </div>

      <div className="relative mt-10 text-center">
        <h1 className="mx-auto max-w-6xl font-display text-6xl font-extrabold leading-tight text-paper">
          {talk.title}
        </h1>
      </div>

      <div className="relative flex flex-1 items-center justify-center gap-16">
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
    </div>
  );
}
