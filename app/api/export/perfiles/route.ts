import { getDashboardData } from "@/lib/pretalx";
import { inferCountry, inferRoleCategory } from "@/lib/profiles";
import { groupCompanies } from "@/lib/companies";
import { toCsv, csvResponse } from "@/lib/csv";

export const dynamic = "force-dynamic";

const OTHER = "Otro / sin especificar";
const SECTION_LABELS: Record<string, [string, string]> = {
  paises: ["País", "Speakers"],
  roles: ["Perfil / rol", "Speakers"],
  empresas: ["Empresa", "Speakers"],
};

function countBy<T>(items: T[], key: (item: T) => string): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()].map(([label, count]) => ({ label, count }));
}

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

  let rows: { label: string; count: number }[];
  if (section === "paises") {
    rows = countBy(filtered, (sp) => inferCountry(sp.location) ?? OTHER);
  } else if (section === "roles") {
    rows = countBy(filtered, (sp) => inferRoleCategory(sp.jobTitle));
  } else {
    rows = groupCompanies(
      filtered
        .filter((sp) => sp.company?.trim())
        .map((sp) => ({
          company: sp.company!,
          person: { code: sp.code, name: sp.name, avatarUrl: sp.avatarUrl },
        }))
    );
  }

  const sorted = [...rows].sort((a, b) => b.count - a.count);
  const [labelHeader, countHeader] = SECTION_LABELS[section];
  const csv = toCsv(
    [labelHeader, countHeader],
    sorted.map((r) => [r.label, r.count])
  );

  return csvResponse(csv, `perfiles-${section}-devopsdays-lima-2026.csv`);
}
