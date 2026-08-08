import { getDashboardData } from "@/lib/pretalx";
import { toCsv, csvResponse } from "@/lib/csv";

export const dynamic = "force-dynamic";

const HEADERS = [
  "Nombre",
  "Email",
  "Teléfono",
  "Empresa",
  "Cargo",
  "Ubicación",
  "DNI / Documento",
  "Talla de polo",
  "LinkedIn",
  "Redes",
  "Charlas",
  "Estado charla(s)",
  "Track(s)",
  "Horario",
  "Sala",
  "Láminas",
];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state") ?? "confirmed";
  const track = url.searchParams.get("track");

  const { speakers, submissions, tracks } = await getDashboardData();
  const submissionByCode = new Map(submissions.map((s) => [s.code, s]));
  const trackById = new Map(tracks.map((t) => [t.id, t]));

  const withTalks = speakers.map((sp) => ({
    speaker: sp,
    talks: sp.submissionCodes
      .map((c) => submissionByCode.get(c))
      .filter((t) => t !== undefined),
  }));

  const filtered = withTalks.filter(({ talks }) => {
    const stateMatch = state === "all" || talks.some((t) => t.state === state);
    const trackMatch = !track || talks.some((t) => String(t.trackId) === track);
    return stateMatch && trackMatch;
  });

  const rows = filtered
    .sort((a, b) => a.speaker.name.localeCompare(b.speaker.name))
    .map(({ speaker: sp, talks }) => {
      const titles = talks.map((t) => t.title).join(" | ");
      const states = talks.map((t) => t.state).join(" | ");
      const trackNames = talks
        .map((t) => (t.trackId ? (trackById.get(t.trackId)?.name ?? "") : ""))
        .join(" | ");
      const schedules = talks
        .map((t) =>
          t.slot?.start
            ? new Date(t.slot.start).toLocaleString("es-PE", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "America/Lima",
              })
            : ""
        )
        .join(" | ");
      const rooms = talks.map((t) => t.slot?.roomName ?? "").join(" | ");
      const slides = talks.map((t) => (t.slidesUrl ? "Sí" : "No")).join(" | ");

      return [
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
        titles,
        states,
        trackNames,
        schedules,
        rooms,
        slides,
      ];
    });

  const csv = toCsv(HEADERS, rows);
  return csvResponse(csv, "speakers-devopsdays-lima-2026.csv");
}
