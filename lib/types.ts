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
};

/** Only public-safe fields. Phone, ID document, t-shirt size and committee
 * notes are never fetched from Pretalx in the first place — see lib/pretalx.ts */
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
};

export type PretalxDataset = {
  speakers: Speaker[];
  submissions: Submission[];
  tracks: Track[];
  submissionTypes: SubmissionType[];
  tags: Tag[];
  rooms: Room[];
};
