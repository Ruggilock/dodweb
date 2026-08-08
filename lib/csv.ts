import "server-only";

function escapeCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const lines = [headers, ...rows].map((row) =>
    row.map((cell) => escapeCell(String(cell))).join(",")
  );
  // Rows MUST be CRLF-terminated. Cells that contain a bare "\n" (e.g. one
  // speaker per line within a cell) stay LF-only — that's what lets Excel
  // tell "end of row" (\r\n) apart from "line break inside this cell" (\n).
  // With a plain \n row separator, Excel treats every \n as a new row and
  // shreds any multiline cell across several rows.
  // BOM so Excel opens UTF-8 (áéíóñ) correctly instead of mangling it.
  return "﻿" + lines.join("\r\n");
}

export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
