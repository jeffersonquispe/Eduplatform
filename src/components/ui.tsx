import type { ReactNode } from "react";

// Primitivas del EduTech Design System (clases .eb-* en globals.css).

export type ButtonVariant = "primary" | "secondary" | "danger" | "link";

export function buttonClass(variant: ButtonVariant = "primary", opts: { sm?: boolean; block?: boolean } = {}) {
  return ["eb-btn", `eb-btn--${variant}`, opts.sm && "eb-btn--sm", opts.block && "eb-btn--block"].filter(Boolean).join(" ");
}

export const inputClass = "eb-input";

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "success" | "warning" | "info"; children: ReactNode }) {
  return <span className={`eb-badge${tone === "neutral" ? "" : ` eb-badge--${tone}`}`}>{children}</span>;
}

export function Alert({ tone = "error", children }: { tone?: "error" | "success" | "info"; children: ReactNode }) {
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`eb-alert eb-alert--${tone}`}>
      {children}
    </p>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={status === "published" ? "success" : "warning"}>{status === "published" ? "Publicado" : "Borrador"}</Badge>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed border-border-strong p-8 text-center text-sm text-fg-3">{children}</div>;
}
