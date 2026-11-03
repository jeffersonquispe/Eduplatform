"use client";

import { useActionState } from "react";
import { signIn, signUp, type AuthState } from "@/app/actions/auth";
import { Alert, buttonClass, inputClass } from "@/components/ui";

const initial: AuthState = {};

const submitClass = buttonClass("primary", { block: true });

function Feedback({ state }: { state: AuthState }) {
  if (state.error) return <Alert tone="error">{state.error}</Alert>;
  if (state.notice) return <Alert tone="success">{state.notice}</Alert>;
  return null;
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signIn, initial);
  return (
    <form action={action} className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <label className="eb-label">
        <span>Correo</span>
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </label>
      <label className="eb-label">
        <span>Contrasena</span>
        <input name="password" type="password" required autoComplete="current-password" className={inputClass} />
      </label>
      <Feedback state={state} />
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Entrando..." : "Iniciar sesion"}
      </button>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(signUp, initial);
  return (
    <form action={action} className="space-y-4">
      <label className="eb-label">
        <span>Nombre</span>
        <input name="display_name" type="text" required autoComplete="name" className={inputClass} />
      </label>
      <label className="eb-label">
        <span>Correo</span>
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </label>
      <label className="eb-label">
        <span>Contrasena (minimo 8 caracteres)</span>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
      </label>
      <fieldset className="space-y-2 text-sm text-fg-1">
        <legend className="mb-1">Quiero registrarme como</legend>
        <label className="flex items-center gap-2">
          <input type="radio" name="role" value="student" defaultChecked /> Estudiante: quiero aprender
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="role" value="instructor" /> Instructor: quiero publicar cursos
        </label>
      </fieldset>
      <Feedback state={state} />
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Creando cuenta..." : "Crear cuenta"}
      </button>
    </form>
  );
}
