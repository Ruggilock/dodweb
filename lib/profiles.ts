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

/** [normalized key, display city name, country name] */
const CITY_ALIASES: [string, string, string][] = [
  ["lima", "Lima", "Perú"],
  ["tacna", "Tacna", "Perú"],
  ["piura", "Piura", "Perú"],
  ["arequipa", "Arequipa", "Perú"],
  ["cusco", "Cusco", "Perú"],
  ["medellin", "Medellín", "Colombia"],
  ["medellín", "Medellín", "Colombia"],
  ["bogota", "Bogotá", "Colombia"],
  ["bucaramanga", "Bucaramanga", "Colombia"],
  ["cali", "Cali", "Colombia"],
  ["sao paulo", "São Paulo", "Brasil"],
  ["rio de janeiro", "Río de Janeiro", "Brasil"],
  ["santiago", "Santiago", "Chile"],
  ["quito", "Quito", "Ecuador"],
  ["guayaquil", "Guayaquil", "Ecuador"],
  ["buenos aires", "Buenos Aires", "Argentina"],
  ["monterrey", "Monterrey", "México"],
  ["ciudad de mexico", "Ciudad de México", "México"],
  ["cdmx", "Ciudad de México", "México"],
  ["guadalajara", "Guadalajara", "México"],
  ["miami", "Miami", "Estados Unidos"],
  ["boston", "Boston", "Estados Unidos"],
  ["florida", "Florida", "Estados Unidos"],
  ["new york", "New York", "Estados Unidos"],
  ["bangalore", "Bangalore", "India"],
  ["holzkirchen", "Holzkirchen", "Alemania"],
  ["montevideo", "Montevideo", "Uruguay"],
];

function matchWords(n: string, key: string): boolean {
  return key.includes(" ")
    ? n.includes(key)
    : new Set(n.split(/[^a-z]+/).filter(Boolean)).has(key);
}

export function inferCountry(raw: string | null): string | null {
  if (!raw) return null;
  const n = normalize(raw);
  if (n.replace(/[^a-z]/g, "").length < 2) return null;

  for (const [key, name] of COUNTRY_ALIASES) {
    if (matchWords(n, key)) return name;
  }
  for (const [key, , country] of CITY_ALIASES) {
    if (matchWords(n, key)) return country;
  }
  return null;
}

/** Best-effort city extraction — only recognized cities are named; everything else is null. */
export function inferCity(raw: string | null): string | null {
  if (!raw) return null;
  const n = normalize(raw);
  if (n.replace(/[^a-z]/g, "").length < 2) return null;

  for (const [key, city] of CITY_ALIASES) {
    if (matchWords(n, key)) return city;
  }
  return null;
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
