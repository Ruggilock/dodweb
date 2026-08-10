/**
 * Location and job title are free-text fields in Pretalx (not structured
 * country/role pickers) — see the raw samples in PRETALX.md. These are
 * best-effort heuristics built from the actual answers on file, not an
 * exhaustive geocoder or taxonomy. Unrecognized values fall into "Otro /
 * sin especificar" rather than being guessed wrong.
 */

import type { Person } from "@/lib/companies";

export function groupByWithPeople<T>(
  items: T[],
  key: (item: T) => string,
  toPerson: (item: T) => Person
): { label: string; count: number; people: Person[] }[] {
  const groups = new Map<string, Person[]>();
  for (const item of items) {
    const k = key(item);
    const list = groups.get(k) ?? [];
    list.push(toPerson(item));
    groups.set(k, list);
  }
  return [...groups.entries()].map(([label, people]) => ({ label, count: people.length, people }));
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

const COUNTRY_ALIASES: [string, string][] = [
  ["peru", "Perú"],
  ["chile", "Chile"],
  ["brasil", "Brasil"],
  ["brazil", "Brasil"],
  ["mexico", "México"],
  ["colombia", "Colombia"],
  ["ecuador", "Ecuador"],
  ["argentina", "Argentina"],
  ["uruguay", "Uruguay"],
  ["paraguay", "Paraguay"],
  ["bolivia", "Bolivia"],
  ["venezuela", "Venezuela"],
  ["panama", "Panamá"],
  ["guatemala", "Guatemala"],
  ["espana", "España"],
  ["spain", "España"],
  ["estados unidos", "Estados Unidos"],
  ["united states", "Estados Unidos"],
  ["eeuu", "Estados Unidos"],
  ["usa", "Estados Unidos"],
  ["us", "Estados Unidos"],
  ["canada", "Canadá"],
  ["alemania", "Alemania"],
  ["germany", "Alemania"],
  ["india", "India"],
  ["portugal", "Portugal"],
  ["francia", "Francia"],
  ["france", "Francia"],
];

const CITY_ALIASES: [string, string][] = [
  ["lima", "Perú"],
  ["tacna", "Perú"],
  ["piura", "Perú"],
  ["arequipa", "Perú"],
  ["cusco", "Perú"],
  ["medellin", "Colombia"],
  ["medellín", "Colombia"],
  ["bogota", "Colombia"],
  ["bucaramanga", "Colombia"],
  ["cali", "Colombia"],
  ["sao paulo", "Brasil"],
  ["rio de janeiro", "Brasil"],
  ["santiago", "Chile"],
  ["quito", "Ecuador"],
  ["guayaquil", "Ecuador"],
  ["buenos aires", "Argentina"],
  ["monterrey", "México"],
  ["ciudad de mexico", "México"],
  ["cdmx", "México"],
  ["guadalajara", "México"],
  ["miami", "Estados Unidos"],
  ["boston", "Estados Unidos"],
  ["florida", "Estados Unidos"],
  ["new york", "Estados Unidos"],
  ["bangalore", "India"],
  ["holzkirchen", "Alemania"],
  ["montevideo", "Uruguay"],
];

export function inferCountry(raw: string | null): string | null {
  if (!raw) return null;
  const n = normalize(raw);
  if (n.replace(/[^a-z]/g, "").length < 2) return null;

  const words = new Set(n.split(/[^a-z]+/).filter(Boolean));
  const match = (list: [string, string][]) => {
    for (const [key, name] of list) {
      if (key.includes(" ") ? n.includes(key) : words.has(key)) return name;
    }
    return null;
  };

  return match(COUNTRY_ALIASES) ?? match(CITY_ALIASES);
}

const ROLE_BUCKETS: [RegExp, string][] = [
  [/\b(ceo|cto|cio|ciso|coo|cfo|cpo|founder|fundador|co-?founder)\b/, "C-level / Founder"],
  [/\b(director|vp|vicepresidente|vice president)\b/, "Director / VP"],
  [/\b(architect|arquitecto)/, "Architect"],
  [/\b(engineer|ingenier|developer|desarrollador)/, "Engineer / Developer"],
  [/\b(head|manager|gerente|lead|lider|líder|jefe)\b/, "Lead / Manager"],
  [/\b(consultant|consultor|specialist|especialista|advocate)/, "Consultant / Specialist"],
];

export function inferRoleCategory(jobTitle: string | null): string {
  if (!jobTitle) return "Otro / sin especificar";
  const n = normalize(jobTitle);
  for (const [re, label] of ROLE_BUCKETS) {
    if (re.test(n)) return label;
  }
  return "Otro / sin especificar";
}
