import { getDashboardData } from "@/lib/pretalx";
import { toCsv, csvResponse } from "@/lib/csv";

export const dynamic = "force-dynamic";

const HEADERS = [
  "Charla",
  "Descripción",
  "Estado",
  "Tipo",
  "Track",
  "Nivel",
  "Duración (min)",
  "Día/Hora",
  "Sala",
  "Láminas",
  "Speaker",
  "Email",
  "Teléfono",
  "Empresa",
  "Cargo",
  "Ubicación",
  "DNI / Documento",
  "Talla de polo",
  "LinkedIn",
  "Redes",
  "Foto",
];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") ?? "confirmed";
  const type = url.searchParams.get("type");

  const { submissions, speakers, tracks, submissionTypes, tags } = await getDashboardData();
  const speakerByCode = new Map(speakers.map((s) => [s.code, s]));
  const trackById = new Map(tracks.map((t) => [t.id, t]));
  const typeById = new Map(submissionTypes.map((t) => [t.id, t]));
  const tagById = new Map(tags.map((t) => [t.id, t]));

  let filtered: typeof submissions;
  if (code) {
    // Single-talk export (from the talk detail page) — ignores state/type filters.
    filtered = submissions.filter((s) => s.code === code);
  } else {
    const talks = submissions.filter(
      (s) => typeById.get(s.submissionTypeId)?.name.toLowerCase() !== "event"
    );
    const byState = state === "all" ? talks : talks.filter((s) => s.state === state);
    filtered = type ? byState.filter((s) => String(s.submissionTypeId) === type) : byState;
  }

  // One row per talk. Every speaker field is newline-joined (one line per
  // speaker, same position across columns) so a 3-speaker panel still fits
  // one row, but each column lines up — line 2 of "Email" is line 2 of
  // "Speaker", etc.
  const lines = (values: string[]) => values.join("\n");

  const rows = [...filtered]
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((t) => {
      const track = t.trackId ? trackById.get(t.trackId) : null;
      const sType = typeById.get(t.submissionTypeId);
      const tagNames = t.tagIds
        .map((id) => tagById.get(id)?.name)
        .filter(Boolean)
        .join(" | ");
      const schedule = t.slot?.start
        ? new Date(t.slot.start).toLocaleString("es-PE", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "America/Lima",
          })
        : "";

      const talkSpeakers = t.speakerCodes
        .map((c) => speakerByCode.get(c))
        .filter((sp) => sp !== undefined);

      return [
        t.title,
        t.abstract,
        t.state,
        sType?.name ?? "",
        track?.name ?? "",
        tagNames,
        t.durationMinutes,
        schedule,
        t.slot?.roomName ?? "",
        t.slidesUrl ?? "",
        lines(talkSpeakers.map((sp) => sp.name)),
        lines(talkSpeakers.map((sp) => sp.email ?? "")),
        lines(talkSpeakers.map((sp) => sp.phone ?? "")),
        lines(talkSpeakers.map((sp) => sp.company ?? "")),
        lines(talkSpeakers.map((sp) => sp.jobTitle ?? "")),
        lines(talkSpeakers.map((sp) => sp.location ?? "")),
        lines(talkSpeakers.map((sp) => sp.identityDocument ?? "")),
        lines(talkSpeakers.map((sp) => sp.tshirtSize ?? "")),
        lines(talkSpeakers.map((sp) => sp.linkedin ?? "")),
        lines(talkSpeakers.map((sp) => sp.social ?? "")),
        lines(talkSpeakers.map((sp) => sp.avatarUrl ?? "")),
      ];
    });

  const csv = toCsv(HEADERS, rows);
  const filename = code ? `charla-${code}.csv` : "charlas-devopsdays-lima-2026.csv";
  return csvResponse(csv, filename);
}
