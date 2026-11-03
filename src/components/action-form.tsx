"use client";

import { useActionState, type ReactNode } from "react";
import type { ActionState } from "@/app/actions/courses";
import { Alert, buttonClass } from "@/components/ui";

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children?: ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  // Pide confirmacion antes de enviar (acciones destructivas).
  confirm?: string;
  variant?: "primary" | "secondary" | "danger" | "link";
  className?: string;
};

export function ActionForm({ action, children, submitLabel, pendingLabel, confirm, variant = "primary", className }: Props) {
  const [state, formAction, pending] = useActionState(action, {} as ActionState);

  return (
    <form
      action={formAction}
      className={className}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
      {state.error ? (
        <div className="mt-2">
          <Alert tone="error">{state.error}</Alert>
        </div>
      ) : null}
      {state.ok ? (
        <div className="mt-2">
          <Alert tone="success">{state.ok}</Alert>
        </div>
      ) : null}
      <button type="submit" disabled={pending} className={`${buttonClass(variant, { sm: true })} ${children ? "mt-3" : ""}`}>
        {pending ? (pendingLabel ?? "Guardando...") : submitLabel}
      </button>
    </form>
  );
}
