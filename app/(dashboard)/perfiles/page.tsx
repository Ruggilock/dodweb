import Link from "next/link";
import { getDashboardData } from "@/lib/pretalx";
import { inferCountry, inferRoleCategory } from "@/lib/profiles";
import { groupCompanies } from "@/lib/companies";
import { ExpandableBarList } from "@/components/ExpandableBarList";
import { StatCard } from "@/components/StatCard";
import type { Speaker } from "@/lib/types";

// See app/(dashboard)/page.tsx for why this is force-dynamic instead of revalidate.
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ state?: string }>;

const OTHER = "Otro / sin especificar";

function groupByWithPeople(
  items: Speaker[],
  key: (item: Speaker) => string
): { label: string; count: number; people: { code: string; name: string; avatarUrl: string | null }[] }[] {
  const groups = new Map<string, { code: string; name: string; avatarUrl: string | null }[]>();
  for (const item of items) {
    const k = key(item);
    const list = groups.get(k) ?? [];
    list.push({ code: item.code, name: item.name, avatarUrl: item.avatarUrl });
    groups.set(k, list);
  }
  return [...groups.entries()].map(([label, people]) => ({ label, count: people.length, people }));
}

function DownloadCsv({ href }: { href: string }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1 text-xs font-medium text-mute hover:text-purple"
    >
      ⬇ Descargar CSV
    </a>
  );
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

  const countries = groupByWithPeople(filtered, (sp) => inferCountry(sp.location) ?? OTHER);
  const roles = groupByWithPeople(filtered, (sp) => inferRoleCategory(sp.jobTitle));
  const companies = groupCompanies(
    filtered
      .filter((sp) => sp.company?.trim())
      .map((sp) => ({
        company: sp.company!,
        person: { code: sp.code, name: sp.name, avatarUrl: sp.avatarUrl },
      }))
  );

  const distinctCountries = countries.filter((c) => c.label !== OTHER).length;
  const exportQs = activeState !== "confirmed" ? `&state=${activeState}` : "";

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
          <div className="mb-1 flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold text-ink">Países</h2>
            <DownloadCsv href={`/api/export/perfiles?section=paises${exportQs}`} />
          </div>
          <p className="mb-4 text-xs text-mute">
            Inferido del campo &quot;Ubicación&quot; (texto libre) que llena cada speaker — click
            para ver quiénes son.
          </p>
          <ExpandableBarList items={countries} />
        </section>

        <section className="rounded-lg border border-line bg-white p-5">
          <div className="mb-1 flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold text-ink">Perfil / rol</h2>
            <DownloadCsv href={`/api/export/perfiles?section=roles${exportQs}`} />
          </div>
          <p className="mb-4 text-xs text-mute">
            Inferido del &quot;Job Title&quot; declarado (CTO, VP, Architect, Engineer...) — click
            para ver quiénes son.
          </p>
          <ExpandableBarList items={roles} />
        </section>
      </div>

      <section className="rounded-lg border border-line bg-white p-5">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-ink">Empresas ({companies.length})</h2>
          <DownloadCsv href={`/api/export/perfiles?section=empresas${exportQs}`} />
        </div>
        <p className="mb-4 text-xs text-mute">
          Todas las empresas representadas, de mayor a menor. Variantes del mismo nombre
          (ej. BCP / Banco de Crédito del Perú) están agrupadas — click para ver quiénes son.
        </p>
        <ExpandableBarList items={companies} />
      </section>
    </div>
  );
}
