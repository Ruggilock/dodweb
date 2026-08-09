import "server-only";

/**
 * Client for Pretalx's genuinely PUBLIC, unauthenticated API — no
 * PRETALX_API_TOKEN is read or sent anywhere in this file. This is the data
 * source for the MCP server (app/api/mcp/route.ts via lib/mcp-data.ts).
 *
 * Verified by hand which fields Pretalx itself exposes without auth (see
 * PRETALX.md > MCP): of the speaker questions, only Company (385), Job
 * Title (386), Location (387) and LinkedIn (388) come through — Social
 * Networks (398), Phone, Identity document and T-shirt size never do, no
 * matter what. ALL submission-target questions are blocked too, including
 * Slides (462) — so there is no public slidesUrl. This isn't something we
 * filter; Pretalx's own API refuses to return it unauthenticated.
 *
 * Uses `?expand=` to embed related data (track, submission_type, tags,
 * slots.room, speakers.answers.question) in one call instead of Pretalx's
 * separate --token-only /answers/ and /tags/ endpoints.
 */

const BASE_URL = process.env.PRETALX_BASE_URL ?? "https://talks.devopsdays.org";
const EVENT_SLUG = process.env.PRETALX_EVENT_SLUG ?? "";
const REVALIDATE_SECONDS = 300;

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

async function fetchPublicJson<T>(path: string): Promise<T> {
  if (!EVENT_SLUG) throw new Error("Missing PRETALX_EVENT_SLUG environment variable");
  const url = path.startsWith("http") ? path : `${BASE_URL}/api/events/${EVENT_SLUG}${path}`;

  // Deliberately no Authorization header.
  const res = await fetch(url, {
    next: { revalidate: REVALIDATE_SECONDS, tags: ["pretalx-public"] },
  });
  if (!res.ok) {
    throw new Error(`Pretalx public API error ${res.status} for ${path}`);
  }
  return res.json() as Promise<T>;
}

async function fetchAllPublicPages<T>(path: string): Promise<T[]> {
  const results: T[] = [];
  let next: string | null = path;
  while (next) {
    const page: Paginated<T> = await fetchPublicJson<Paginated<T>>(next);
    results.push(...page.results);
    next = page.next;
  }
  return results;
}

type RawLocalized = Record<string, string>;
type RawQuestion = { id: number; question: RawLocalized };
type RawAnswer = { question: RawQuestion; answer: string; answer_file: string | null };
type RawTrack = { id: number; name: RawLocalized };
type RawSubmissionType = { id: number; name: RawLocalized; default_duration: number };
type RawTag = { id: number; tag: string };
type RawRoom = { id: number; name: RawLocalized };
type RawSlot = { id: number; room: RawRoom | null; start: string | null; end: string | null };

type RawPublicSpeaker = {
  code: string;
  name: string;
  biography: string | null;
  avatar_url: string | null;
  answers: RawAnswer[];
};

type RawPublicSubmission = {
  code: string;
  title: string;
  abstract: string | null;
  state: string;
  duration: number | null;
  speakers: RawPublicSpeaker[];
  track: RawTrack | null;
  submission_type: RawSubmissionType;
  tags: RawTag[];
  slots: RawSlot[];
};

function localized(v?: RawLocalized | null): string {
  if (!v) return "";
  return v.en ?? v.es ?? Object.values(v)[0] ?? "";
}

/** The only 4 speaker questions Pretalx exposes unauthenticated. */
const PUBLIC_QUESTION_FIELD: Record<number, "company" | "jobTitle" | "location" | "linkedin"> = {
  385: "company",
  386: "jobTitle",
  387: "location",
  388: "linkedin",
};

export type PublicSpeaker = {
  code: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  company: string | null;
  jobTitle: string | null;
  location: string | null;
  linkedin: string | null;
};

function mapSpeaker(s: RawPublicSpeaker): PublicSpeaker {
  const fields: Partial<Record<"company" | "jobTitle" | "location" | "linkedin", string>> = {};
  for (const a of s.answers) {
    const key = PUBLIC_QUESTION_FIELD[a.question.id];
    if (key) fields[key] = a.answer_file ?? a.answer;
  }
  return {
    code: s.code,
    name: s.name,
    bio: s.biography,
    avatarUrl: s.avatar_url,
    company: fields.company ?? null,
    jobTitle: fields.jobTitle ?? null,
    location: fields.location ?? null,
    linkedin: fields.linkedin ?? null,
  };
}

export type PublicSubmission = {
  code: string;
  title: string;
  abstract: string;
  state: string;
  durationMinutes: number;
  track: string | null;
  type: string;
  tags: string[];
  slot: { day: string; start: string; end: string | null; room: string | null } | null;
  speakers: PublicSpeaker[];
};

export type EventInfo = {
  name: string;
  dateFrom: string;
  dateTo: string;
  timezone: string;
};

export async function fetchPublicEventInfo(): Promise<EventInfo> {
  const raw = await fetchPublicJson<{
    name: RawLocalized;
    date_from: string;
    date_to: string;
    timezone: string;
  }>("/");
  return {
    name: localized(raw.name),
    dateFrom: raw.date_from,
    dateTo: raw.date_to,
    timezone: raw.timezone,
  };
}

export async function fetchPublicSpeakers(): Promise<PublicSpeaker[]> {
  const raw = await fetchAllPublicPages<RawPublicSpeaker>("/speakers/?expand=answers.question");
  return raw.map(mapSpeaker);
}

export async function fetchPublicSubmissions(): Promise<PublicSubmission[]> {
  const raw = await fetchAllPublicPages<RawPublicSubmission>(
    "/submissions/?expand=speakers.answers.question,track,submission_type,tags,slots.room"
  );
  return raw.map((s) => {
    const slot = s.slots[0];
    return {
      code: s.code,
      title: s.title,
      abstract: s.abstract ?? "",
      state: s.state,
      durationMinutes: s.duration ?? 0,
      track: s.track ? localized(s.track.name) : null,
      type: localized(s.submission_type.name),
      tags: s.tags.map((t) => t.tag),
      slot:
        slot?.start != null
          ? { day: slot.start.slice(0, 10), start: slot.start, end: slot.end, room: slot.room ? localized(slot.room.name) : null }
          : null,
      speakers: s.speakers.map(mapSpeaker),
    };
  });
}
