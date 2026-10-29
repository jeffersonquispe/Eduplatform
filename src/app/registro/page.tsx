import Link from "next/link";
import { RegisterForm } from "@/components/auth-forms";

export const metadata = { title: "Crear cuenta" };

export default function RegisterPage() {
  return (
    <main className="mx-auto w-full max-w-sm px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Crear cuenta</h1>
      <RegisterForm />
      <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="underline">
          Inicia sesion
        </Link>
      </p>
    </main>
  );
}
