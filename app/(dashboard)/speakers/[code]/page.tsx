import Link from "next/link";
import { notFound } from "next/navigation";
import { getDashboardData } from "@/lib/pretalx";
import { Badge } from "@/components/Badge";
import { StateBadge } from "@/components/StateBadge";

// See app/(dashboard)/page.tsx for why this is force-dynamic instead of revalidate.
export const dynamic = "force-dynamic";

type Params = Promise<{ code: string }>;

function Field({
  label,
  value,
  missingLabel = "Falta",
}: {
  label: string;
  value: string | null;
  missingLabel?: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-mute">{label}</p>
      {value ? (
        <p className="mt-0.5 text-sm text-ink">{value}</p>
      ) : (
        <p className="mt-0.5">
          <Badge tone="warn">{missingLabel}</Badge>
        </p>
      )}
    </div>
  );
}

export default async function SpeakerDetailPage({ params }: { params: Params }) {
  const { code } = await params;
  const { speakers, submissions, tracks, submissionTypes } = await getDashboardData();

  const speaker = speakers.find((s) => s.code === code);
  if (!speaker) notFound();

  const trackById = new Map(tracks.map((t) => [t.id, t]));
  const typeById = new Map(submissionTypes.map((t) => [t.id, t]));
  const talks = speaker.submissionCodes
    .map((c) => submissions.find((s) => s.code === c))
    .filter((t) => t !== undefined);

  return (
    <div className="space-y-8">
      <Link href="/speakers" className="text-sm text-mute hover:text-purple">
        ← Volver a Speakers
      </Link>

      <div className="flex items-center gap-4">
        {speaker.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={speaker.avatarUrl}
            alt={speaker.name}
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-purple-wash font-display text-xl font-bold text-purple">
            {speaker.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">{speaker.name}</h1>
          {(speaker.jobTitle || speaker.company) && (
            <p className="mt-1 text-mute">
              {[speaker.jobTitle, speaker.company].filter(Boolean).join(" · ")}
            </p>
          )}
          {speaker.location && <p className="text-sm text-mute">📍 {speaker.location}</p>}
        </div>
      </div>

      {speaker.biography && (
        <p className="max-w-2xl text-sm leading-relaxed text-ink">{speaker.biography}</p>
      )}

      <section>
        <h2 className="mb-4 font-display text-lg font-bold text-ink">Contacto y redes</h2>
        <div className="grid grid-cols-2 gap-6 rounded-lg border border-line bg-white p-5 sm:grid-cols-4">
          <Field label="Email" value={speaker.email} />
          <Field label="Teléfono" value={speaker.phone} />
          <Field
            label="LinkedIn"
            value={speaker.linkedin}
          />
          <Field label="Redes / Perfil" value={speaker.social} />
        </div>
        {(speaker.linkedin || speaker.social) && (
          <div className="mt-2 flex gap-4 text-sm">
            {speaker.linkedin && (
              <a
                href={speaker.linkedin}
                target="_blank"
                rel="noreferrer"
                className="text-purple hover:underline"
              >
                Abrir LinkedIn ↗
              </a>
            )}
            {speaker.social && (
              <a
                href={speaker.social}
                target="_blank"
                rel="noreferrer"
                className="text-purple hover:underline"
              >
                Abrir redes ↗
              </a>
            )}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg font-bold text-ink">Logística</h2>
        <div className="grid grid-cols-2 gap-6 rounded-lg border border-line bg-white p-5 sm:grid-cols-4">
          <Field label="Talla de polo" value={speaker.tshirtSize} />
          <Field label="DNI / documento" value={speaker.identityDocument} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg font-bold text-ink">
          Charlas ({talks.length})
        </h2>
        <div className="space-y-3">
          {talks.map((t) => {
            const track = t!.trackId ? trackById.get(t!.trackId) : null;
            const type = typeById.get(t!.submissionTypeId);
            return (
              <div
                key={t!.code}
                className="rounded-lg border border-line bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium text-ink">{t!.title}</p>
                  <StateBadge state={t!.state} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-mute">
                  {type && <Badge tone="mute">{type.name}</Badge>}
                  {track && <span>{track.name}</span>}
                  {t!.slot?.start && (
                    <span>
                      ·{" "}
                      {new Date(t!.slot.start).toLocaleString("es-PE", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "America/Lima",
                      })}{" "}
                      · {t!.slot.roomName}
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  {t!.slidesUrl ? (
                    <a
                      href={t!.slidesUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-purple hover:underline"
                    >
                      Ver láminas ↗
                    </a>
                  ) : (
                    <Badge tone="warn">Láminas pendientes</Badge>
                  )}
                </div>
              </div>
            );
          })}
          {talks.length === 0 && (
            <p className="text-sm text-mute">Sin charlas asociadas.</p>
          )}
        </div>
      </section>
    </div>
  );
}
