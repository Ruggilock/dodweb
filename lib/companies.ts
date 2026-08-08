/**
 * Company is free text in Pretalx, so the same employer shows up under
 * several spellings. Case/accent-only differences (e.g. "NTT DATA" vs
 * "NTT Data") merge automatically via normalization below — no list needed.
 * This list is only for genuinely different wording for the same company
 * (e.g. the acronym vs the full legal name), built from the actual answers
 * on file (see PRETALX.md). Kept intentionally small and high-confidence:
 * related-but-distinct entities (e.g. Credicorp vs Credicorp Capital) are
 * NOT merged here.
 */
const ALIAS_GROUPS: string[][] = [
  ["bcp", "banco de credito del peru"],
  ["ntt data", "nttdata peru"],
  ["pacifico seguros", "pacifico compania de seguros y reaseguros"],
  ["scotiabank", "scotiabank peru"],
  ["thoughtworks", "thoughtworks brazil"],
];

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

const VARIANT_TO_GROUP = new Map<string, number>();
ALIAS_GROUPS.forEach((variants, i) => variants.forEach((v) => VARIANT_TO_GROUP.set(v, i)));

export type Person = { code: string; name: string; avatarUrl: string | null };

export type CompanyGroup = {
  /** All distinct raw spellings found, joined — e.g. "BCP / Banco de Credito del Perú" */
  label: string;
  count: number;
  people: Person[];
};

export function groupCompanies(entries: { company: string; person: Person }[]): CompanyGroup[] {
  const groups = new Map<string, { rawNames: Set<string>; people: Person[] }>();

  for (const { company, person } of entries) {
    const raw = company.trim();
    if (!raw) continue;
    const n = normalize(raw);
    const groupIdx = VARIANT_TO_GROUP.get(n);
    const key = groupIdx !== undefined ? `group:${groupIdx}` : `single:${n}`;
    const g = groups.get(key) ?? { rawNames: new Set<string>(), people: [] };
    g.rawNames.add(raw);
    g.people.push(person);
    groups.set(key, g);
  }

  return [...groups.values()].map((g) => ({
    label: [...g.rawNames].sort().join(" / "),
    count: g.people.length,
    people: g.people,
  }));
}
