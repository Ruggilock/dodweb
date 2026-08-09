import "server-only";
import { getDashboardData, getEventInfo as fetchEventInfo } from "./pretalx";

/**
 * Public-only view of the Pretalx dataset, for the unauthenticated MCP
 * server (app/api/mcp/route.ts). This is the one place that decides what's
 * "public": PII fields (email, phone, identityDocument, tshirtSize) are
 * dropped here even though lib/pretalx.ts already fetches them for the
 * authenticated dashboard — never forward the raw Speaker/Submission
 * objects from lib/pretalx.ts to an MCP tool result.
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
  social: string | null;
  talks: { code: string; title: string }[];
};

export type PublicTalkSchedule = {
  day: string;
  start: string;
  end: string | null;
  room: string | null;
};

export type PublicTalk = {
  code: string;
  title: string;
  abstract: string;
  track: string | null;
  type: string;
  tags: string[];
  durationMinutes: number;
  schedule: PublicTalkSchedule | null;
  speakers: { code: string; name: string }[];
  slidesUrl: string | null;
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

export type TrackSummary = { id: number; name: string; talkCount: number };
export type SessionTypeSummary = {
  id: number;
  name: string;
  durationMinutes: number;
  talkCount: number;
};

export type EventOverview = {
  name: string;
  dateFrom: string;
  dateTo: string;
  timezone: string;
  totalSpeakers: number;
  totalConfirmedTalks: number;
};

const isEventType = (typeName: string) => typeName.toLowerCase() === "event";

async function getPublicDataset() {
  const { speakers, submissions, tracks, submissionTypes, tags } = await getDashboardData();
  const trackById = new Map(tracks.map((t) => [t.id, t]));
  const typeById = new Map(submissionTypes.map((t) => [t.id, t]));
  const tagById = new Map(tags.map((t) => [t.id, t]));
  const speakerByCode = new Map(speakers.map((s) => [s.code, s]));

  // Real talks: confirmed, and not a program block (registro/bienvenida/etc).
  const confirmedTalks = submissions.filter(
    (s) => s.state === "confirmed" && !isEventType(typeById.get(s.submissionTypeId)?.name ?? "")
  );

  return { speakers, submissions, tracks, submissionTypes, tags, trackById, typeById, tagById, speakerByCode, confirmedTalks };
}

function toPublicTalk(
  s: Awaited<ReturnType<typeof getPublicDataset>>["confirmedTalks"][number],
  ctx: Awaited<ReturnType<typeof getPublicDataset>>
): PublicTalk {
  const track = s.trackId ? ctx.trackById.get(s.trackId) : null;
  const type = ctx.typeById.get(s.submissionTypeId);
  return {
    code: s.code,
    title: s.title,
    abstract: s.abstract,
    track: track?.name ?? null,
    type: type?.name ?? "",
    tags: s.tagIds.map((id) => ctx.tagById.get(id)?.name).filter((n) => n !== undefined),
    durationMinutes: s.durationMinutes,
    schedule: s.slot?.start
      ? { day: s.slot.day!, start: s.slot.start, end: s.slot.end, room: s.slot.roomName }
      : null,
    speakers: s.speakerCodes
      .map((c) => ctx.speakerByCode.get(c))
      .filter((sp) => sp !== undefined)
      .map((sp) => ({ code: sp.code, name: sp.name })),
    slidesUrl: s.slidesUrl,
  };
}

export async function listPublicTalks(filter?: {
  track?: string;
  type?: string;
  tag?: string;
  day?: string;
}): Promise<PublicTalk[]> {
  const ctx = await getPublicDataset();
  let talks = ctx.confirmedTalks;

  if (filter?.track) {
    const q = filter.track.toLowerCase();
    talks = talks.filter((s) => {
      const track = s.trackId ? ctx.trackById.get(s.trackId) : null;
      return track?.name.toLowerCase().includes(q);
    });
  }
  if (filter?.type) {
    const q = filter.type.toLowerCase();
    talks = talks.filter((s) => ctx.typeById.get(s.submissionTypeId)?.name.toLowerCase().includes(q));
  }
  if (filter?.tag) {
    const q = filter.tag.toLowerCase();
    talks = talks.filter((s) =>
      s.tagIds.some((id) => ctx.tagById.get(id)?.name.toLowerCase().includes(q))
    );
  }
  if (filter?.day) {
    talks = talks.filter((s) => s.slot?.day === filter.day);
  }

  return talks
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((s) => toPublicTalk(s, ctx));
}

export async function getPublicTalk(code: string): Promise<PublicTalk | null> {
  const ctx = await getPublicDataset();
  const talk = ctx.confirmedTalks.find((s) => s.code === code);
  return talk ? toPublicTalk(talk, ctx) : null;
}

function toPublicSpeaker(
  sp: Awaited<ReturnType<typeof getPublicDataset>>["speakers"][number],
  ctx: Awaited<ReturnType<typeof getPublicDataset>>
): PublicSpeaker {
  const talks = sp.submissionCodes
    .map((c) => ctx.confirmedTalks.find((t) => t.code === c))
    .filter((t) => t !== undefined)
    .map((t) => ({ code: t.code, title: t.title }));
  return {
    code: sp.code,
    name: sp.name,
    bio: sp.biography,
    avatarUrl: sp.avatarUrl,
    company: sp.company,
    jobTitle: sp.jobTitle,
    location: sp.location,
    linkedin: sp.linkedin,
    social: sp.social,
    talks,
  };
}

export async function listPublicSpeakers(filter?: { track?: string }): Promise<PublicSpeaker[]> {
  const ctx = await getPublicDataset();
  const confirmedCodes = new Set(ctx.confirmedTalks.flatMap((t) => t.speakerCodes));
  let speakers = ctx.speakers.filter((sp) => confirmedCodes.has(sp.code));

  if (filter?.track) {
    const q = filter.track.toLowerCase();
    speakers = speakers.filter((sp) =>
      sp.submissionCodes.some((c) => {
        const t = ctx.confirmedTalks.find((talk) => talk.code === c);
        const track = t?.trackId ? ctx.trackById.get(t.trackId) : null;
        return track?.name.toLowerCase().includes(q);
      })
    );
  }

  return speakers
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((sp) => toPublicSpeaker(sp, ctx));
}

export async function getPublicSpeaker(code: string): Promise<PublicSpeaker | null> {
  const ctx = await getPublicDataset();
  const sp = ctx.speakers.find((s) => s.code === code);
  return sp ? toPublicSpeaker(sp, ctx) : null;
}

/** Full-day agenda, including program blocks (registro, bienvenida, etc) —
 * those are excluded from listPublicTalks but belong in a schedule view. */
export async function getAgenda(day?: string): Promise<AgendaItem[]> {
  const { submissions, tracks, submissionTypes, speakers } = await getDashboardData();
  const trackById = new Map(tracks.map((t) => [t.id, t]));
  const typeById = new Map(submissionTypes.map((t) => [t.id, t]));
  const speakerByCode = new Map(speakers.map((s) => [s.code, s]));

  const scheduled = submissions.filter(
    (s) => s.state === "confirmed" && s.slot?.start && (!day || s.slot.day === day)
  );

  return scheduled
    .sort((a, b) => a.slot!.start!.localeCompare(b.slot!.start!))
    .map((s) => {
      const track = s.trackId ? trackById.get(s.trackId) : null;
      return {
        code: s.code,
        title: s.title,
        type: typeById.get(s.submissionTypeId)?.name ?? "",
        track: track?.name ?? null,
        start: s.slot!.start!,
        end: s.slot!.end,
        room: s.slot!.roomName,
        speakers: s.speakerCodes
          .map((c) => speakerByCode.get(c))
          .filter((sp) => sp !== undefined)
          .map((sp) => ({ code: sp.code, name: sp.name })),
      };
    });
}

export async function listTracks(): Promise<TrackSummary[]> {
  const ctx = await getPublicDataset();
  return ctx.tracks
    .map((t) => ({
      id: t.id,
      name: t.name,
      talkCount: ctx.confirmedTalks.filter((s) => s.trackId === t.id).length,
    }))
    .filter((t) => t.talkCount > 0)
    .sort((a, b) => b.talkCount - a.talkCount);
}

export async function listSessionTypes(): Promise<SessionTypeSummary[]> {
  const ctx = await getPublicDataset();
  return ctx.submissionTypes
    .filter((t) => !isEventType(t.name))
    .map((t) => ({
      id: t.id,
      name: t.name,
      durationMinutes: t.durationMinutes,
      talkCount: ctx.confirmedTalks.filter((s) => s.submissionTypeId === t.id).length,
    }))
    .filter((t) => t.talkCount > 0)
    .sort((a, b) => b.talkCount - a.talkCount);
}

export async function getEventOverview(): Promise<EventOverview> {
  const [info, ctx] = await Promise.all([fetchEventInfo(), getPublicDataset()]);
  const confirmedSpeakerCodes = new Set(ctx.confirmedTalks.flatMap((t) => t.speakerCodes));
  return {
    name: info.name,
    dateFrom: info.dateFrom,
    dateTo: info.dateTo,
    timezone: info.timezone,
    totalSpeakers: confirmedSpeakerCodes.size,
    totalConfirmedTalks: ctx.confirmedTalks.length,
  };
}

export async function searchPublic(
  query: string
): Promise<{ talks: PublicTalk[]; speakers: PublicSpeaker[] }> {
  const q = query.trim().toLowerCase();
  if (!q) return { talks: [], speakers: [] };

  const ctx = await getPublicDataset();
  const confirmedCodes = new Set(ctx.confirmedTalks.flatMap((t) => t.speakerCodes));

  const talks = ctx.confirmedTalks
    .filter((s) => s.title.toLowerCase().includes(q) || s.abstract.toLowerCase().includes(q))
    .map((s) => toPublicTalk(s, ctx));

  const speakers = ctx.speakers
    .filter((sp) => confirmedCodes.has(sp.code))
    .filter(
      (sp) =>
        sp.name.toLowerCase().includes(q) ||
        (sp.biography ?? "").toLowerCase().includes(q) ||
        (sp.company ?? "").toLowerCase().includes(q)
    )
    .map((sp) => toPublicSpeaker(sp, ctx));

  return { talks, speakers };
}
