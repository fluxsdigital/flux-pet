import Link from "next/link";

import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-margin-mobile py-space-xl text-on-surface">
      <section className="w-full max-w-md rounded-3xl bg-surface-container-lowest p-space-xl shadow-xl">
        <Link className="text-label-sm font-extrabold uppercase tracking-widest text-primary" href="/">Flux Pet</Link>
        <h1 className="mt-3 text-headline-lg font-extrabold">Bem-vindo de volta</h1>
        <p className="mt-2 text-on-surface-variant">Acesse a operação e a saúde financeira do seu pet shop.</p>
        <AuthForm mode="login" />
      </section>
    </main>
  );
}
