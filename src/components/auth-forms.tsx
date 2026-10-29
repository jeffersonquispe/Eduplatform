"use client";

import { useActionState } from "react";
import { signIn, signUp, type AuthState } from "@/app/actions/auth";

const initial: AuthState = {};

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
const buttonClass =
  "w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900";

function Feedback({ state }: { state: AuthState }) {
  if (state.error)
    return (
      <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
        {state.error}
      </p>
    );
  if (state.notice)
    return (
      <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
        {state.notice}
      </p>
    );
  return null;
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signIn, initial);
  return (
    <form action={action} className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <label className="block space-y-1 text-sm">
        <span>Correo</span>
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </label>
      <label className="block space-y-1 text-sm">
        <span>Contrasena</span>
        <input name="password" type="password" required autoComplete="current-password" className={inputClass} />
      </label>
      <Feedback state={state} />
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Entrando..." : "Iniciar sesion"}
      </button>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(signUp, initial);
  return (
    <form action={action} className="space-y-4">
      <label className="block space-y-1 text-sm">
        <span>Nombre</span>
        <input name="display_name" type="text" required autoComplete="name" className={inputClass} />
      </label>
      <label className="block space-y-1 text-sm">
        <span>Correo</span>
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </label>
      <label className="block space-y-1 text-sm">
        <span>Contrasena (minimo 8 caracteres)</span>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
      </label>
      <fieldset className="space-y-2 text-sm">
        <legend className="mb-1">Quiero registrarme como</legend>
        <label className="flex items-center gap-2">
          <input type="radio" name="role" value="student" defaultChecked /> Estudiante: quiero aprender
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="role" value="instructor" /> Instructor: quiero publicar cursos
        </label>
      </fieldset>
      <Feedback state={state} />
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Creando cuenta..." : "Crear cuenta"}
      </button>
    </form>
  );
}
