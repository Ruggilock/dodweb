import Link from "next/link";
import { notFound } from "next/navigation";
import { getDashboardData } from "@/lib/pretalx";
import { Badge } from "@/components/Badge";
import { StateBadge } from "@/components/StateBadge";

// See app/(dashboard)/page.tsx for why this is force-dynamic instead of revalidate.
export const dynamic = "force-dynamic";

type Params = Promise<{ code: string }>;

export default async function TalkDetailPage({ params }: { params: Params }) {
  const { code } = await params;
  const { submissions, speakers, tracks, submissionTypes, tags } = await getDashboardData();

  const talk = submissions.find((s) => s.code === code);
  if (!talk) notFound();

  const track = talk.trackId ? tracks.find((t) => t.id === talk.trackId) : null;
  const type = submissionTypes.find((t) => t.id === talk.submissionTypeId);
  const talkTags = talk.tagIds
    .map((id) => tags.find((t) => t.id === id))
    .filter((t) => t !== undefined);
  const talkSpeakers = talk.speakerCodes
    .map((c) => speakers.find((s) => s.code === c))
    .filter((s) => s !== undefined);
  const isKeynote = type?.name.toLowerCase() === "keynote";

  return (
    <div className="space-y-8">
      <Link href="/talks" className="text-sm text-mute hover:text-purple">
        ← Volver a Charlas
      </Link>

      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {type && <Badge tone={isKeynote ? "purple" : "mute"}>{type.name}</Badge>}
          <StateBadge state={talk.state} />
          {talkTags.map((t) => (
            <Badge key={t.id} tone="info">
              {t.name}
            </Badge>
          ))}
        </div>
        <h1 className="font-display text-2xl font-extrabold text-ink">{talk.title}</h1>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-mute">
          {track && <span>{track.name}</span>}
          <span>{talk.durationMinutes} min</span>
          {talk.slot?.start && (
            <span>
              {new Date(talk.slot.start).toLocaleString("es-PE", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "America/Lima",
              })}{" "}
              · {talk.slot.roomName}
            </span>
          )}
        </div>
      </div>

      {talk.abstract && (
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-ink">Descripción</h2>
          <p className="max-w-2xl whitespace-pre-line text-sm leading-relaxed text-ink">
            {talk.abstract}
          </p>
        </section>
      )}

      <section>
        <h2 className="mb-4 font-display text-lg font-bold text-ink">
          Speaker{talkSpeakers.length !== 1 ? "s" : ""} ({talkSpeakers.length})
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {talkSpeakers.map((sp) => (
            <Link
              key={sp.code}
              href={`/speakers/${sp.code}`}
              className="flex items-center gap-3 rounded-lg border border-line bg-white p-4 transition-shadow hover:shadow-hover"
            >
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
            </Link>
          ))}
          {talkSpeakers.length === 0 && (
            <p className="text-sm text-mute">Sin speakers asignados.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg font-bold text-ink">Material</h2>
        {talk.slidesUrl ? (
          <a
            href={talk.slidesUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-purple hover:underline"
          >
            Ver láminas ↗
          </a>
        ) : (
          <Badge tone="warn">Láminas pendientes</Badge>
        )}
      </section>
    </div>
  );
}
