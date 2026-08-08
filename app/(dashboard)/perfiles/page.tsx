import Link from "next/link";
import { getDashboardData } from "@/lib/pretalx";
import { inferCountry, inferRoleCategory } from "@/lib/profiles";
import { RankedBarList } from "@/components/RankedBarList";
import { StatCard } from "@/components/StatCard";

// See app/(dashboard)/page.tsx for why this is force-dynamic instead of revalidate.
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ state?: string }>;

const OTHER = "Otro / sin especificar";

function countBy<T>(items: T[], key: (item: T) => string): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()].map(([label, count]) => ({ label, count }));
}

export default async function PerfilesPage({ searchParams }: { searchParams: SearchParams }) {
  const { state } = await searchParams;
  const { speakers, submissions } = await getDashboardData();

  const submissionByCode = new Map(submissions.map((s) => [s.code, s]));
  const activeState = state ?? "confirmed";

  const filtered =
    activeState === "all"
      ? speakers
      : speakers.filter((sp) =>
          sp.submissionCodes.some((c) => submissionByCode.get(c)?.state === activeState)
        );

  const countries = countBy(filtered, (sp) => inferCountry(sp.location) ?? OTHER);
  const roles = countBy(filtered, (sp) => inferRoleCategory(sp.jobTitle));
  const companies = countBy(
    filtered.filter((sp) => sp.company?.trim()),
    (sp) => sp.company!.trim()
  );

  const distinctCountries = countries.filter((c) => c.label !== OTHER).length;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">Perfiles</h1>
          <p className="mt-1 text-mute">
            De dónde vienen y a qué se dedican los {filtered.length} speakers
            {activeState === "all" ? "" : " confirmados"}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/perfiles"
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeState === "confirmed"
                ? "bg-purple text-white"
                : "border border-line bg-white text-ink hover:border-purple"
            }`}
          >
            Confirmados
          </Link>
          <Link
            href="/perfiles?state=all"
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeState === "all"
                ? "bg-purple text-white"
                : "border border-line bg-white text-ink hover:border-purple"
            }`}
          >
            Todos
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Speakers" value={filtered.length} />
        <StatCard label="Países" value={distinctCountries} />
        <StatCard label="Empresas distintas" value={companies.length} />
        <StatCard
          label="C-level / Founder"
          value={roles.find((r) => r.label === "C-level / Founder")?.count ?? 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-line bg-white p-5">
          <h2 className="mb-1 font-display text-lg font-bold text-ink">Países</h2>
          <p className="mb-4 text-xs text-mute">
            Inferido del campo &quot;Ubicación&quot; (texto libre) que llena cada speaker.
          </p>
          <RankedBarList items={countries} />
        </section>

        <section className="rounded-lg border border-line bg-white p-5">
          <h2 className="mb-1 font-display text-lg font-bold text-ink">Perfil / rol</h2>
          <p className="mb-4 text-xs text-mute">
            Inferido del &quot;Job Title&quot; declarado (CTO, VP, Architect, Engineer...).
          </p>
          <RankedBarList items={roles} />
        </section>
      </div>

      <section className="rounded-lg border border-line bg-white p-5">
        <h2 className="mb-1 font-display text-lg font-bold text-ink">
          Empresas ({companies.length})
        </h2>
        <p className="mb-4 text-xs text-mute">Todas las empresas representadas, de mayor a menor.</p>
        <RankedBarList items={companies} maxItems={companies.length} />
      </section>
    </div>
  );
}
