import { getDashboardData } from "@/lib/pretalx";
import { inferCountry, inferCity, inferRoleCategory, groupByWithPeople } from "@/lib/profiles";
import { groupCompanies } from "@/lib/companies";
import { toCsv, csvResponse } from "@/lib/csv";

export const dynamic = "force-dynamic";

const OTHER = "Otro / sin especificar";
const SECTION_LABELS: Record<string, [string, string, string]> = {
  paises: ["País", "Speakers", "Nombres"],
  ciudades: ["Ciudad", "Speakers", "Nombres"],
  roles: ["Perfil / rol", "Speakers", "Nombres"],
  empresas: ["Empresa", "Speakers", "Nombres"],
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const section = url.searchParams.get("section") ?? "";
  const state = url.searchParams.get("state") ?? "confirmed";

  if (!(section in SECTION_LABELS)) {
    return new Response("Unknown section", { status: 400 });
  }

  const { speakers, submissions } = await getDashboardData();
  const submissionByCode = new Map(submissions.map((s) => [s.code, s]));

  const filtered =
    state === "all"
      ? speakers
      : speakers.filter((sp) =>
          sp.submissionCodes.some((c) => submissionByCode.get(c)?.state === state)
        );

  const toPerson = (sp: (typeof filtered)[number]) => ({
    code: sp.code,
    name: sp.name,
    avatarUrl: sp.avatarUrl,
  });

  let rows: { label: string; count: number; people: { name: string }[] }[];
  if (section === "paises") {
    rows = groupByWithPeople(filtered, (sp) => inferCountry(sp.location) ?? OTHER, toPerson);
  } else if (section === "ciudades") {
    rows = groupByWithPeople(filtered, (sp) => inferCity(sp.location) ?? OTHER, toPerson);
  } else if (section === "roles") {
    rows = groupByWithPeople(filtered, (sp) => inferRoleCategory(sp.jobTitle), toPerson);
  } else {
    rows = groupCompanies(
      filtered
        .filter((sp) => sp.company?.trim())
        .map((sp) => ({ company: sp.company!, person: toPerson(sp) }))
    );
  }

  const sorted = [...rows].sort((a, b) => b.count - a.count);
  const [labelHeader, countHeader, namesHeader] = SECTION_LABELS[section];
  const csv = toCsv(
    [labelHeader, countHeader, namesHeader],
    sorted.map((r) => [r.label, r.count, r.people.map((p) => p.name).join("\n")])
  );

  return csvResponse(csv, `perfiles-${section}-devopsdays-lima-2026.csv`);
}
