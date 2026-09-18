import Link from "next/link";

export default function SystemFoundationPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-margin-mobile text-on-surface">
      <section className="w-full max-w-lg rounded-3xl bg-surface-container-lowest p-space-xl shadow-xl">
        <span className="text-label-sm font-bold uppercase tracking-widest text-primary">Flux Pet</span>
        <h1 className="mt-2 text-headline-lg font-extrabold">Sistema em construção</h1>
        <p className="mt-space-sm text-body-lg text-on-surface-variant">
          A fundação operacional está pronta para receber autenticação, estoque, PDV e inteligência financeira.
        </p>
        <Link className="mt-space-lg inline-flex text-label-lg font-bold text-primary" href="/">Voltar para a apresentação</Link>
      </section>
    </main>
  );
}
