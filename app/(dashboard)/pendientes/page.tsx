import Link from "next/link";
import type { ReactNode } from "react";
import { getDashboardData } from "@/lib/pretalx";
import { CompletionBar } from "@/components/CompletionBar";
import { StateBadge } from "@/components/StateBadge";
import { Badge } from "@/components/Badge";
import { FilterSelect } from "@/components/FilterSelect";

// See app/(dashboard)/page.tsx for why this is force-dynamic instead of revalidate.
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ slidesType?: string }>;

function PendingList({
  title,
  count,
  filter,
  children,
}: {
  title: string;
  count: number;
  filter?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">
          {title} ({count})
        </h2>
        {filter}
      </div>
      {count === 0 ? (
        <p className="text-sm text-mute">Todo completo 🎉</p>
      ) : (
        <ul className="max-h-96 overflow-y-auto">{children}</ul>
      )}
    </div>
  );
}

export default async function PendientesPage({ searchParams }: { searchParams: SearchParams }) {
  const { slidesType } = await searchParams;
  const { speakers, submissions, submissionTypes } = await getDashboardData();
  const typeById = new Map(submissionTypes.map((t) => [t.id, t]));
  const speakerByCode = new Map(speakers.map((s) => [s.code, s]));

  const isRealTalk = (s: (typeof submissions)[number]) =>
    typeById.get(s.submissionTypeId)?.name.toLowerCase() !== "event";

  const confirmedTalks = submissions.filter((s) => s.state === "confirmed" && isRealTalk(s));
  const confirmedSpeakerCodes = new Set(confirmedTalks.flatMap((s) => s.speakerCodes));
  const confirmedSpeakers = speakers
    .filter((sp) => confirmedSpeakerCodes.has(sp.code))
    .sort((a, b) => a.name.localeCompare(b.name));

  const allMissingSlides = [...confirmedTalks]
    .filter((s) => !s.slidesUrl)
    .sort((a, b) => a.title.localeCompare(b.title));
  const missingSlidesTypes = [...new Set(allMissingSlides.map((s) => s.submissionTypeId))]
    .map((id) => typeById.get(id))
    .filter((t): t is NonNullable<typeof t> => t !== undefined)
    .sort((a, b) => a.name.localeCompare(b.name));
  const missingSlides = allMissingSlides.filter(
    (s) => !slidesType || String(s.submissionTypeId) === slidesType
  );
  const missingTshirt = confirmedSpeakers.filter((sp) => !sp.tshirtSize);
  const missingDni = confirmedSpeakers.filter((sp) => !sp.identityDocument);

  const demoSubmissions = submissions
    .filter((s) => typeById.get(s.submissionTypeId)?.name.toLowerCase() === "demo session")
    .sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-ink">Pendientes</h1>
        <p className="mt-1 text-mute">
          Checklist de logística para las {confirmedTalks.length} charlas y{" "}
          {confirmedSpeakers.length} speakers confirmados.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CompletionBar
          label="Láminas subidas"
          filled={confirmedTalks.length - allMissingSlides.length}
          total={confirmedTalks.length}
        />
        <CompletionBar
          label="Talla de polo"
          filled={confirmedSpeakers.length - missingTshirt.length}
          total={confirmedSpeakers.length}
        />
        <CompletionBar
          label="DNI / documento"
          filled={confirmedSpeakers.length - missingDni.length}
          total={confirmedSpeakers.length}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <PendingList
          title="Faltan láminas"
          count={missingSlides.length}
          filter={
            missingSlidesTypes.length > 1 ? (
              <FilterSelect
                label="Tipo"
                paramName="slidesType"
                value={slidesType ?? ""}
                options={[
                  { value: "", label: "Todos" },
                  ...missingSlidesTypes.map((t) => ({ value: String(t.id), label: t.name })),
                ]}
              />
            ) : null
          }
        >
          {missingSlides.map((s) => (
            <li key={s.code} className="border-b border-line py-2 last:border-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-ink">{s.title}</p>
                <Badge tone="mute">{typeById.get(s.submissionTypeId)?.name ?? "—"}</Badge>
              </div>
              <p className="text-xs text-mute">
                {s.speakerCodes
                  .map((c) => speakerByCode.get(c))
                  .filter((sp) => sp !== undefined)
                  .map((sp) => (
                    <Link key={sp.code} href={`/speakers/${sp.code}`} className="hover:text-purple">
                      {sp.name}
                    </Link>
                  ))
                  .reduce<ReactNode[]>(
                    (acc, el, i) => (i === 0 ? [el] : [...acc, ", ", el]),
                    []
                  )}
              </p>
            </li>
          ))}
        </PendingList>

        <PendingList title="Falta talla de polo" count={missingTshirt.length}>
          {missingTshirt.map((sp) => (
            <li key={sp.code} className="border-b border-line py-2 last:border-0">
              <Link
                href={`/speakers/${sp.code}`}
                className="text-sm font-medium text-ink hover:text-purple"
              >
                {sp.name}
              </Link>
            </li>
          ))}
        </PendingList>

        <PendingList title="Falta DNI" count={missingDni.length}>
          {missingDni.map((sp) => (
            <li key={sp.code} className="border-b border-line py-2 last:border-0">
              <Link
                href={`/speakers/${sp.code}`}
                className="text-sm font-medium text-ink hover:text-purple"
              >
                {sp.name}
              </Link>
            </li>
          ))}
        </PendingList>
      </div>

      <div className="rounded-lg border border-line bg-white p-5">
        <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink">
          Demos — estado de speakers ({demoSubmissions.length})
        </h2>
        {demoSubmissions.length === 0 ? (
          <p className="text-sm text-mute">No hay sesiones de tipo Demo.</p>
        ) : (
          <ul>
            {demoSubmissions.map((s) => (
              <li
                key={s.code}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-2 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{s.title}</p>
                  <p className="text-xs text-mute">
                    {s.speakerCodes
                      .map((c) => speakerByCode.get(c))
                      .filter((sp) => sp !== undefined)
                      .map((sp) => (
                        <Link key={sp.code} href={`/speakers/${sp.code}`} className="hover:text-purple">
                          {sp.name}
                        </Link>
                      ))
                      .reduce<ReactNode[]>(
                        (acc, el, i) => (i === 0 ? [el] : [...acc, ", ", el]),
                        []
                      )}
                  </p>
                </div>
                <StateBadge state={s.state} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
