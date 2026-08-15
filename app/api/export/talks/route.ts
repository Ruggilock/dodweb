import ExcelJS from "exceljs";
import { getDashboardData } from "@/lib/pretalx";

export const dynamic = "force-dynamic";

const COLUMNS: { header: string; width: number }[] = [
  { header: "Charla", width: 42 },
  { header: "Descripción", width: 60 },
  { header: "Estado", width: 12 },
  { header: "Tipo", width: 12 },
  { header: "Track", width: 26 },
  { header: "Idioma", width: 12 },
  { header: "Nivel", width: 18 },
  { header: "Duración (min)", width: 12 },
  { header: "Día/Hora", width: 18 },
  { header: "Sala", width: 16 },
  { header: "Láminas", width: 16 },
  { header: "Coordinador", width: 16 },
  { header: "Speaker", width: 26 },
  { header: "Foto", width: 44 },
];

/** Columns merged vertically across a talk's speaker rows (everything
 * except the last two, Speaker/Foto, which vary per row). */
const MERGED_COLUMN_COUNT = COLUMNS.length - 2;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") ?? "confirmed";
  const type = url.searchParams.get("type");
  const track = url.searchParams.get("track");
  const language = url.searchParams.get("language");
  const coordinator = url.searchParams.get("coordinator");

  const { submissions, speakers, tracks, submissionTypes, tags } = await getDashboardData();
  const speakerByCode = new Map(speakers.map((s) => [s.code, s]));
  const trackById = new Map(tracks.map((t) => [t.id, t]));
  const typeById = new Map(submissionTypes.map((t) => [t.id, t]));
  const tagById = new Map(tags.map((t) => [t.id, t]));

  let filtered: typeof submissions;
  if (code) {
    // Single-talk export (from the talk detail page) — ignores state/type/etc filters.
    filtered = submissions.filter((s) => s.code === code);
  } else {
    const talks = submissions.filter(
      (s) => typeById.get(s.submissionTypeId)?.name.toLowerCase() !== "event"
    );
    filtered = talks.filter((s) => {
      const stateMatch = state === "all" || s.state === state;
      const typeMatch = !type || String(s.submissionTypeId) === type;
      const trackMatch = !track || String(s.trackId) === track;
      const languageMatch = !language || s.language === language;
      const coordinatorMatch = !coordinator || s.coordinator === coordinator;
      return stateMatch && typeMatch && trackMatch && languageMatch && coordinatorMatch;
    });
  }
  const sorted = [...filtered].sort((a, b) => a.title.localeCompare(b.title));

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Charlas");
  sheet.columns = COLUMNS.map((c) => ({ width: c.width }));

  const headerRow = sheet.addRow(COLUMNS.map((c) => c.header));
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEDE6F5" } };
  });

  for (const t of sorted) {
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
      t.language,
      tagNames,
      t.durationMinutes,
      schedule,
      t.slot?.roomName ?? "",
      t.slidesUrl ?? "",
      t.coordinator ?? "",
    ];

    const talkSpeakers = t.speakerCodes
      .map((c) => speakerByCode.get(c))
      .filter((sp) => sp !== undefined);
    const speakerRows = talkSpeakers.length > 0 ? talkSpeakers : [null];

    const startRow = sheet.rowCount + 1;
    for (const sp of speakerRows) {
      const row = sheet.addRow([...talkCols, sp?.name ?? "", sp?.avatarUrl ?? ""]);
      row.eachCell((cell) => {
        cell.alignment = { vertical: "top", wrapText: true };
      });
    }
    const endRow = sheet.rowCount;

    // Merge the talk-level columns vertically across this talk's speaker rows.
    if (endRow > startRow) {
      for (let col = 1; col <= MERGED_COLUMN_COUNT; col++) {
        sheet.mergeCells(startRow, col, endRow, col);
      }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = code ? `charla-${code}.xlsx` : "charlas-devopsdays-lima-2026.xlsx";

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
