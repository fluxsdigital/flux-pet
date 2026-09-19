import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/sign-out-button";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function SystemFoundationPage() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session) redirect("/entrar");
  const membership = await db.membership.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
    include: { organization: true, storeAccess: { include: { store: true } } },
  });
  if (!membership) redirect("/entrar");

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-margin-mobile text-on-surface">
      <section className="w-full max-w-lg rounded-3xl bg-surface-container-lowest p-space-xl shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <span className="text-label-sm font-bold uppercase tracking-widest text-primary">Flux Pet</span>
          <SignOutButton />
        </div>
        <h1 className="mt-2 text-headline-lg font-extrabold">{membership.organization.name}</h1>
        <p className="mt-space-sm text-body-lg text-on-surface-variant">
          Olá, {session.user.name}. Seu acesso <strong>{membership.role}</strong> está ativo para {membership.storeAccess.length} loja(s).
        </p>
        <div className="mt-space-lg flex flex-wrap gap-4">
          <Link className="inline-flex rounded-full bg-primary px-5 py-3 text-label-lg font-bold text-white" href="/sistema/cadastros">Abrir cadastros</Link>
          <Link className="inline-flex rounded-full bg-secondary-container px-5 py-3 text-label-lg font-bold text-on-secondary-container" href="/sistema/estoque">Ver estoque</Link>
          <Link className="inline-flex px-2 py-3 text-label-lg font-bold text-primary" href="/">Voltar para a apresentação</Link>
        </div>
      </section>
    </main>
  );
}
