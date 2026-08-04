import type { ReactNode } from "react";

export type BadgeTone = "purple" | "lime" | "success" | "warn" | "error" | "info" | "mute";

const toneClasses: Record<BadgeTone, string> = {
  purple: "bg-purple-wash text-purple-deep",
  lime: "bg-lime-soft text-purple-deep",
  success: "bg-success/10 text-success",
  warn: "bg-warn/10 text-warn",
  error: "bg-error/10 text-error",
  info: "bg-info/10 text-info",
  mute: "bg-paper-2 text-mute",
};

export function Badge({ children, tone = "mute" }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
