import Link from "next/link";

import { AuthForm } from "@/components/auth-form";

const errors: Record<string, string> = {
  validacao: "Revise os campos e tente novamente.",
  conflito: "Este e-mail já está cadastrado. Entre com sua conta ou use outro e-mail.",
  indisponivel: "O serviço está temporariamente indisponível. Aguarde alguns minutos e tente novamente.",
  inesperado: "Não foi possível criar a conta agora. Tente novamente.",
};

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-margin-mobile py-space-xl text-on-surface">
      <section className="w-full max-w-md rounded-3xl bg-surface-container-lowest p-space-xl shadow-xl">
        <Link className="text-label-sm font-extrabold uppercase tracking-widest text-primary" href="/">Flux Pet</Link>
        <h1 className="mt-3 text-headline-lg font-extrabold">Crie seu workspace</h1>
        <p className="mt-2 text-on-surface-variant">Comece com sua empresa, primeira loja e acesso de proprietário.</p>
        <AuthForm initialError={erro ? errors[erro] : ""} mode="onboarding" />
      </section>
    </main>
  );
}
