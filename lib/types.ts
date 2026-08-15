export type Track = {
  id: number;
  name: string;
  color: string | null;
};

export type SubmissionType = {
  id: number;
  name: string;
  durationMinutes: number;
};

export type Tag = {
  id: number;
  name: string;
  color: string | null;
  description: string | null;
};

export type Room = {
  id: number;
  name: string;
};

export type ScheduleSlot = {
  roomId: number | null;
  roomName: string | null;
  start: string | null;
  end: string | null;
  day: string | null;
};

export type SubmissionState =
  | "confirmed"
  | "submitted"
  | "withdrawn"
  | "canceled"
  | "rejected";

export type Submission = {
  code: string;
  title: string;
  abstract: string;
  state: SubmissionState;
  durationMinutes: number;
  speakerCodes: string[];
  trackId: number | null;
  submissionTypeId: number;
  tagIds: number[];
  slot: ScheduleSlot | null;
  /** URL of the uploaded slides file, or null if not uploaded yet. */
  slidesUrl: string | null;
  /**
   * Internal committee member assigned to this talk (Pretalx question 497,
   * `contains_personal_data: true`, `is_visible_to_reviewers: false`).
   * Same restriction as the internal speaker fields above — dashboard only,
   * never the MCP or any public surface.
   */
  coordinator: string | null;
};

/**
 * `email`, `phone`, `identityDocument` and `tshirtSize` are PII/logistics
 * fields. Only render them on the speaker detail page (/speakers/[code]),
 * the /pendientes ops dashboard, and the /speakers "Filas" table view
 * (email only, opt-in via ?view=rows) — never on the /speakers card grid
 * or CSV/MCP output beyond those same surfaces.
 * Committee notes are still never fetched at all — see lib/pretalx.ts.
 */
export type Speaker = {
  code: string;
  name: string;
  biography: string | null;
  avatarUrl: string | null;
  company: string | null;
  jobTitle: string | null;
  location: string | null;
  linkedin: string | null;
  social: string | null;
  submissionCodes: string[];
  email: string | null;
  phone: string | null;
  identityDocument: string | null;
  tshirtSize: string | null;
};

export type PretalxDataset = {
  speakers: Speaker[];
  submissions: Submission[];
  tracks: Track[];
  submissionTypes: SubmissionType[];
  tags: Tag[];
  rooms: Room[];
};
