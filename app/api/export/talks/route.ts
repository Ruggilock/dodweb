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

  // One row per (talk, speaker) pair — talk columns repeat on every row for
  // that talk, so grouping/filtering by speaker in Excel doesn't lose which
  // talk they belong to. A talk with no assigned speaker still gets one row.
  const rows = [...filtered]
    .sort((a, b) => a.title.localeCompare(b.title))
    .flatMap((t) => {
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

      const talkCols = [
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
      ];

      const talkSpeakers = t.speakerCodes
        .map((c) => speakerByCode.get(c))
        .filter((sp) => sp !== undefined);

      if (talkSpeakers.length === 0) {
        return [[...talkCols, "", "", "", "", "", "", "", "", "", "", ""]];
      }

      return talkSpeakers.map((sp) => [
        ...talkCols,
        sp.name,
        sp.email ?? "",
        sp.phone ?? "",
        sp.company ?? "",
        sp.jobTitle ?? "",
        sp.location ?? "",
        sp.identityDocument ?? "",
        sp.tshirtSize ?? "",
        sp.linkedin ?? "",
        sp.social ?? "",
        sp.avatarUrl ?? "",
      ]);
    });

  const csv = toCsv(HEADERS, rows);
  const filename = code ? `charla-${code}.csv` : "charlas-devopsdays-lima-2026.csv";
  return csvResponse(csv, filename);
}
