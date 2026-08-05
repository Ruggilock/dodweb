import "server-only";
import type {
  PretalxDataset,
  Room,
  ScheduleSlot,
  Speaker,
  Submission,
  SubmissionState,
  SubmissionType,
  Tag,
  Track,
} from "./types";

const BASE_URL = process.env.PRETALX_BASE_URL ?? "https://talks.devopsdays.org";
const EVENT_SLUG = process.env.PRETALX_EVENT_SLUG ?? "";
const API_TOKEN = process.env.PRETALX_API_TOKEN ?? "";

/** Revalidate window (seconds) for all Pretalx fetches. Override with a
 * manual refresh via POST /api/refresh, which busts the "pretalx" tag. */
const REVALIDATE_SECONDS = 300;

/** Shown anywhere a speaker appears (grid, detail page). */
const PUBLIC_SPEAKER_QUESTIONS = {
  company: 385,
  jobTitle: 386,
  location: 387,
  linkedin: 388,
  social: 398,
} as const;

/**
 * PII/logistics fields (phone, identity document, t-shirt size). These are
 * only rendered on the speaker detail page (/speakers/[code]) and the
 * /pendientes ops dashboard — never on the public speakers grid. See
 * PRETALX.md > Speaker fields.
 */
const INTERNAL_SPEAKER_QUESTIONS = {
  phone: 401,
  identityDocument: 463,
  tshirtSize: 464,
} as const;

/** Submission-target question used to track slide uploads. */
const SLIDES_QUESTION_ID = 462;

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

async function fetchJson<T>(path: string): Promise<T> {
  if (!EVENT_SLUG || !API_TOKEN) {
    throw new Error(
      "Missing PRETALX_EVENT_SLUG or PRETALX_API_TOKEN environment variables"
    );
  }
  const url = path.startsWith("http")
    ? path
    : `${BASE_URL}/api/events/${EVENT_SLUG}${path}`;

  const res = await fetch(url, {
    headers: { Authorization: `Token ${API_TOKEN}` },
    next: { revalidate: REVALIDATE_SECONDS, tags: ["pretalx"] },
  });

  if (!res.ok) {
    throw new Error(`Pretalx API error ${res.status} for ${path}`);
  }
  return res.json() as Promise<T>;
}

async function fetchAllPages<T>(path: string): Promise<T[]> {
  const results: T[] = [];
  let next: string | null = path;
  while (next) {
    const page: Paginated<T> = await fetchJson<Paginated<T>>(next);
    results.push(...page.results);
    next = page.next;
  }
  return results;
}

type RawAnswer = {
  question: number;
  answer: string;
  answer_file: string | null;
  person: string | null;
  submission: string | null;
};

/** Maps person/submission code -> answer value, for a single question id.
 * File-type questions (e.g. slides) resolve to their file URL. */
async function fetchAnswerMap(
  questionId: number,
  keyField: "person" | "submission" = "person"
): Promise<Map<string, string>> {
  const answers = await fetchAllPages<RawAnswer>(`/answers/?question=${questionId}`);
  const map = new Map<string, string>();
  for (const a of answers) {
    const key = keyField === "person" ? a.person : a.submission;
    const value = a.answer_file ?? a.answer;
    if (key && value) map.set(key, value);
  }
  return map;
}

type RawTrack = { id: number; name: Record<string, string>; color: string | null };
type RawSubmissionType = {
  id: number;
  name: Record<string, string>;
  default_duration: number;
};
type RawTag = {
  id: number;
  tag: string;
  color: string | null;
  description: Record<string, string> | null;
};
type RawRoom = { id: number; name: Record<string, string> };
type RawSlot = {
  id: number;
  room: number | null;
  start: string | null;
  end: string | null;
  submission: string | null;
  is_visible: boolean;
};
type RawSpeaker = {
  code: string;
  name: string;
  biography: string | null;
  avatar_url: string | null;
  email: string | null;
  submissions: string[];
};
type RawSubmission = {
  code: string;
  title: string;
  abstract: string | null;
  state: string;
  duration: number | null;
  speakers: string[];
  track: number | null;
  submission_type: number;
  tags: number[];
};

function localized(value: Record<string, string> | null | undefined): string {
  if (!value) return "";
  return value.en ?? value.es ?? Object.values(value)[0] ?? "";
}

export async function getTracks(): Promise<Track[]> {
  const raw = await fetchAllPages<RawTrack>("/tracks/");
  return raw.map((t) => ({ id: t.id, name: localized(t.name), color: t.color }));
}

export async function getSubmissionTypes(): Promise<SubmissionType[]> {
  const raw = await fetchAllPages<RawSubmissionType>("/submission-types/");
  return raw.map((t) => ({
    id: t.id,
    name: localized(t.name),
    durationMinutes: t.default_duration,
  }));
}

export async function getTags(): Promise<Tag[]> {
  const raw = await fetchAllPages<RawTag>("/tags/");
  return raw.map((t) => ({
    id: t.id,
    name: t.tag,
    color: t.color,
    description: localized(t.description) || null,
  }));
}

export async function getRooms(): Promise<Room[]> {
  const raw = await fetchAllPages<RawRoom>("/rooms/");
  return raw.map((r) => ({ id: r.id, name: localized(r.name) }));
}

async function getSlotsBySubmission(): Promise<Map<string, ScheduleSlot>> {
  const [raw, rooms] = await Promise.all([
    fetchAllPages<RawSlot>("/slots/"),
    getRooms(),
  ]);
  const roomNames = new Map(rooms.map((r) => [r.id, r.name]));
  const map = new Map<string, ScheduleSlot>();
  for (const s of raw) {
    if (!s.submission || !s.is_visible || !s.start) continue;
    map.set(s.submission, {
      roomId: s.room,
      roomName: s.room ? roomNames.get(s.room) ?? null : null,
      start: s.start,
      end: s.end,
      day: s.start.slice(0, 10),
    });
  }
  return map;
}

export async function getSpeakers(): Promise<Speaker[]> {
  const [raw, company, jobTitle, location, linkedin, social, phone, identityDocument, tshirtSize] =
    await Promise.all([
      fetchAllPages<RawSpeaker>("/speakers/"),
      fetchAnswerMap(PUBLIC_SPEAKER_QUESTIONS.company),
      fetchAnswerMap(PUBLIC_SPEAKER_QUESTIONS.jobTitle),
      fetchAnswerMap(PUBLIC_SPEAKER_QUESTIONS.location),
      fetchAnswerMap(PUBLIC_SPEAKER_QUESTIONS.linkedin),
      fetchAnswerMap(PUBLIC_SPEAKER_QUESTIONS.social),
      fetchAnswerMap(INTERNAL_SPEAKER_QUESTIONS.phone),
      fetchAnswerMap(INTERNAL_SPEAKER_QUESTIONS.identityDocument),
      fetchAnswerMap(INTERNAL_SPEAKER_QUESTIONS.tshirtSize),
    ]);

  return raw.map((s) => ({
    code: s.code,
    name: s.name,
    biography: s.biography,
    avatarUrl: s.avatar_url,
    company: company.get(s.code) ?? null,
    jobTitle: jobTitle.get(s.code) ?? null,
    location: location.get(s.code) ?? null,
    linkedin: linkedin.get(s.code) ?? null,
    social: social.get(s.code) ?? null,
    submissionCodes: s.submissions,
    email: s.email,
    phone: phone.get(s.code) ?? null,
    identityDocument: identityDocument.get(s.code) ?? null,
    tshirtSize: tshirtSize.get(s.code) ?? null,
  }));
}

export async function getSubmissions(): Promise<Submission[]> {
  const [raw, slots, slides] = await Promise.all([
    fetchAllPages<RawSubmission>("/submissions/"),
    getSlotsBySubmission(),
    fetchAnswerMap(SLIDES_QUESTION_ID, "submission"),
  ]);

  return raw.map((s) => ({
    code: s.code,
    title: s.title,
    abstract: s.abstract ?? "",
    state: s.state as SubmissionState,
    durationMinutes: s.duration ?? 0,
    speakerCodes: s.speakers,
    trackId: s.track,
    submissionTypeId: s.submission_type,
    tagIds: s.tags,
    slot: slots.get(s.code) ?? null,
    slidesUrl: slides.get(s.code) ?? null,
  }));
}

export async function getDashboardData(): Promise<PretalxDataset> {
  const [speakers, submissions, tracks, submissionTypes, tags, rooms] =
    await Promise.all([
      getSpeakers(),
      getSubmissions(),
      getTracks(),
      getSubmissionTypes(),
      getTags(),
      getRooms(),
    ]);

  return { speakers, submissions, tracks, submissionTypes, tags, rooms };
}
