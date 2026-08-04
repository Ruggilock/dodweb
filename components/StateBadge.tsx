import type { SubmissionState } from "@/lib/types";
import { Badge, type BadgeTone } from "./Badge";

const STATE_MAP: Record<SubmissionState, { label: string; tone: BadgeTone }> = {
  confirmed: { label: "Confirmada", tone: "success" },
  submitted: { label: "En revisión", tone: "info" },
  withdrawn: { label: "Retirada", tone: "mute" },
  canceled: { label: "Cancelada", tone: "mute" },
  rejected: { label: "Rechazada", tone: "error" },
};

export function StateBadge({ state }: { state: SubmissionState }) {
  const s = STATE_MAP[state] ?? { label: state, tone: "mute" as const };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
