import Link from "next/link";
import { RegisterForm } from "@/components/auth-forms";

export const metadata = { title: "Crear cuenta" };

export default function RegisterPage() {
  return (
    <main id="contenido" tabIndex={-1} className="mx-auto w-full max-w-sm px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Crear cuenta</h1>
      <RegisterForm />
      <p className="mt-4 text-sm text-fg-2">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-link underline">
          Inicia sesion
        </Link>
      </p>
    </main>
  );
}
