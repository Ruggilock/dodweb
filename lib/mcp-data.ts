import "server-only";
import {
  fetchPublicSpeakers,
  fetchPublicSubmissions,
  fetchPublicEventInfo,
  type PublicSubmission,
} from "./pretalx-public";

/**
 * Data layer for the unauthenticated MCP server (app/api/mcp/route.ts).
 * Sourced entirely from lib/pretalx-public.ts — Pretalx's own public,
 * token-free API. No PRETALX_API_TOKEN is used anywhere in this path; see
 * lib/pretalx-public.ts for exactly which fields Pretalx itself exposes
 * unauthenticated (that's a Pretalx-side decision, not something we filter
 * here) and PRETALX.md > MCP for the reasoning.
 */

export type PublicSpeaker = {
  code: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  company: string | null;
  jobTitle: string | null;
  location: string | null;
  linkedin: string | null;
  talks: { code: string; title: string }[];
};

export type PublicTalk = {
  code: string;
  title: string;
  abstract: string;
  track: string | null;
  type: string;
  tags: string[];
  durationMinutes: number;
  schedule: { day: string; start: string; end: string | null; room: string | null } | null;
  speakers: { code: string; name: string }[];
};

export type AgendaItem = {
  code: string;
  title: string;
  type: string;
  track: string | null;
  start: string;
  end: string | null;
  room: string | null;
  speakers: { code: string; name: string }[];
};

export type TrackSummary = { name: string; talkCount: number };
export type SessionTypeSummary = { name: string; talkCount: number };

export type EventOverview = {
  name: string;
  dateFrom: string;
  dateTo: string;
  timezone: string;
  totalSpeakers: number;
  totalConfirmedTalks: number;
};

const isEventType = (typeName: string) => typeName.toLowerCase() === "event";

async function getDataset() {
  const [speakers, submissions] = await Promise.all([
    fetchPublicSpeakers(),
    fetchPublicSubmissions(),
  ]);
  const speakerByCode = new Map(speakers.map((s) => [s.code, s]));
  // Pretalx's public /submissions/ already only returns public+confirmed
  // items, but filter explicitly anyway rather than trust that implicitly.
  const confirmedTalks = submissions.filter((s) => s.state === "confirmed" && !isEventType(s.type));
  return { speakers, submissions, speakerByCode, confirmedTalks };
}

function toPublicTalk(s: PublicSubmission): PublicTalk {
  return {
    code: s.code,
    title: s.title,
    abstract: s.abstract,
    track: s.track,
    type: s.type,
    tags: s.tags,
    durationMinutes: s.durationMinutes,
    schedule: s.slot,
    speakers: s.speakers.map((sp) => ({ code: sp.code, name: sp.name })),
  };
}

export async function listPublicTalks(filter?: {
  track?: string;
  type?: string;
  tag?: string;
  day?: string;
}): Promise<PublicTalk[]> {
  const { confirmedTalks } = await getDataset();
  let talks = confirmedTalks;

  if (filter?.track) {
    const q = filter.track.toLowerCase();
    talks = talks.filter((s) => s.track?.toLowerCase().includes(q));
  }
  if (filter?.type) {
    const q = filter.type.toLowerCase();
    talks = talks.filter((s) => s.type.toLowerCase().includes(q));
  }
  if (filter?.tag) {
    const q = filter.tag.toLowerCase();
    talks = talks.filter((s) => s.tags.some((t) => t.toLowerCase().includes(q)));
  }
  if (filter?.day) {
    talks = talks.filter((s) => s.slot?.day === filter.day);
  }

  return talks.sort((a, b) => a.title.localeCompare(b.title)).map(toPublicTalk);
}

export async function getPublicTalk(code: string): Promise<PublicTalk | null> {
  const { confirmedTalks } = await getDataset();
  const talk = confirmedTalks.find((s) => s.code === code);
  return talk ? toPublicTalk(talk) : null;
}

function toPublicSpeaker(
  sp: Awaited<ReturnType<typeof getDataset>>["speakers"][number],
  confirmedTalks: PublicSubmission[]
): PublicSpeaker {
  const talks = confirmedTalks
    .filter((t) => t.speakers.some((s) => s.code === sp.code))
    .map((t) => ({ code: t.code, title: t.title }));
  return { ...sp, talks };
}

export async function listPublicSpeakers(filter?: { track?: string }): Promise<PublicSpeaker[]> {
  const { speakers, confirmedTalks } = await getDataset();
  const confirmedCodes = new Set(confirmedTalks.flatMap((t) => t.speakers.map((s) => s.code)));
  let scoped = speakers.filter((sp) => confirmedCodes.has(sp.code));

  if (filter?.track) {
    const q = filter.track.toLowerCase();
    scoped = scoped.filter((sp) =>
      confirmedTalks.some(
        (t) => t.speakers.some((s) => s.code === sp.code) && t.track?.toLowerCase().includes(q)
      )
    );
  }

  return scoped
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((sp) => toPublicSpeaker(sp, confirmedTalks));
}

export async function getPublicSpeaker(code: string): Promise<PublicSpeaker | null> {
  const { speakerByCode, confirmedTalks } = await getDataset();
  const sp = speakerByCode.get(code);
  return sp ? toPublicSpeaker(sp, confirmedTalks) : null;
}

/** Full-day agenda, including program blocks (registro, bienvenida, etc) —
 * those are excluded from listPublicTalks but belong in a schedule view. */
export async function getAgenda(day?: string): Promise<AgendaItem[]> {
  const { submissions } = await getDataset();
  const scheduled = submissions.filter(
    (s) => s.state === "confirmed" && s.slot && (!day || s.slot.day === day)
  );

  return scheduled
    .sort((a, b) => a.slot!.start.localeCompare(b.slot!.start))
    .map((s) => ({
      code: s.code,
      title: s.title,
      type: s.type,
      track: s.track,
      start: s.slot!.start,
      end: s.slot!.end,
      room: s.slot!.room,
      speakers: s.speakers.map((sp) => ({ code: sp.code, name: sp.name })),
    }));
}

export async function listTracks(): Promise<TrackSummary[]> {
  const { confirmedTalks } = await getDataset();
  const counts = new Map<string, number>();
  for (const t of confirmedTalks) {
    if (!t.track) continue;
    counts.set(t.track, (counts.get(t.track) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, talkCount]) => ({ name, talkCount }))
    .sort((a, b) => b.talkCount - a.talkCount);
}

export async function listSessionTypes(): Promise<SessionTypeSummary[]> {
  const { confirmedTalks } = await getDataset();
  const counts = new Map<string, number>();
  for (const t of confirmedTalks) {
    counts.set(t.type, (counts.get(t.type) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, talkCount]) => ({ name, talkCount }))
    .sort((a, b) => b.talkCount - a.talkCount);
}

export async function getEventOverview(): Promise<EventOverview> {
  const [info, { confirmedTalks }] = await Promise.all([fetchPublicEventInfo(), getDataset()]);
  const confirmedSpeakerCodes = new Set(confirmedTalks.flatMap((t) => t.speakers.map((s) => s.code)));
  return {
    name: info.name,
    dateFrom: info.dateFrom,
    dateTo: info.dateTo,
    timezone: info.timezone,
    totalSpeakers: confirmedSpeakerCodes.size,
    totalConfirmedTalks: confirmedTalks.length,
  };
}

export async function searchPublic(
  query: string
): Promise<{ talks: PublicTalk[]; speakers: PublicSpeaker[] }> {
  const q = query.trim().toLowerCase();
  if (!q) return { talks: [], speakers: [] };

  const { speakers, confirmedTalks } = await getDataset();
  const confirmedCodes = new Set(confirmedTalks.flatMap((t) => t.speakers.map((s) => s.code)));

  const talks = confirmedTalks
    .filter((s) => s.title.toLowerCase().includes(q) || s.abstract.toLowerCase().includes(q))
    .map(toPublicTalk);

  const matchedSpeakers = speakers
    .filter((sp) => confirmedCodes.has(sp.code))
    .filter(
      (sp) =>
        sp.name.toLowerCase().includes(q) ||
        (sp.bio ?? "").toLowerCase().includes(q) ||
        (sp.company ?? "").toLowerCase().includes(q)
    )
    .map((sp) => toPublicSpeaker(sp, confirmedTalks));

  return { talks, speakers: matchedSpeakers };
}
