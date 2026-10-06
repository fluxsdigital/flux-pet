import Link from "next/link";

import { AuthForm } from "@/components/auth-form";

const errors: Record<string, string> = {
  credenciais: "E-mail ou senha inválidos. Confira os dados e tente novamente.",
  origem: "Este endereço não está autorizado para acesso. Abra o sistema pelo endereço configurado ou contate o suporte.",
  limite: "Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.",
  indisponivel: "O serviço de acesso está temporariamente indisponível. Tente novamente em alguns minutos.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ cadastro?: string; erro?: string }> }) {
  const { cadastro, erro } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-margin-mobile py-space-xl text-on-surface">
      <section className="w-full max-w-md rounded-3xl bg-surface-container-lowest p-space-xl shadow-xl">
        <Link className="text-label-sm font-extrabold uppercase tracking-widest text-primary" href="/">Flux Pet</Link>
        <h1 className="mt-3 text-headline-lg font-extrabold">Bem-vindo de volta</h1>
        <p className="mt-2 text-on-surface-variant">Acesse a operação e a saúde financeira do seu pet shop.</p>
        <AuthForm accountCreated={cadastro === "sucesso"} initialError={erro ? errors[erro] : ""} mode="login" />
      </section>
    </main>
  );
}
