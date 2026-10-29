"use client";

import { useActionState, type ReactNode } from "react";
import type { ActionState } from "@/app/actions/courses";

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

const VARIANTS = {
  primary: "rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900",
  secondary: "rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800",
  danger: "rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950",
  link: "text-sm underline",
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
        <p role="alert" className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="mt-2 text-sm text-green-700 dark:text-green-400">
          {state.ok}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={`${VARIANTS[variant]} disabled:opacity-60 ${children ? "mt-3" : ""}`}>
        {pending ? (pendingLabel ?? "Guardando...") : submitLabel}
      </button>
    </form>
  );
}
