"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { authClient } from "@/lib/auth-client";

type Mode = "login" | "onboarding";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    if (mode === "onboarding") {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ownerName: form.get("ownerName"),
          organizationName: form.get("organizationName"),
          storeName: form.get("storeName"),
          email,
          password,
        }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setError(body.error ?? "Não foi possível criar a conta.");
        setPending(false);
        return;
      }
    }

    const result = await authClient.signIn.email({ email, password });
    if (result.error) {
      setError(mode === "login" ? "E-mail ou senha inválidos." : "Conta criada, mas não foi possível iniciar a sessão.");
      setPending(false);
      return;
    }
    router.push("/sistema");
    router.refresh();
  }

  return (
    <form className="mt-space-lg space-y-space-sm" onSubmit={submit}>
      {mode === "onboarding" && (
        <>
          <Field label="Seu nome" name="ownerName" autoComplete="name" />
          <Field label="Nome do pet shop" name="organizationName" autoComplete="organization" />
          <Field label="Nome da primeira loja" name="storeName" autoComplete="organization-title" />
        </>
      )}
      <Field label="E-mail" name="email" type="email" autoComplete="email" />
      <Field label="Senha" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={10} />
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
      <button className="w-full rounded-full bg-primary px-6 py-3 font-bold text-white disabled:opacity-60" disabled={pending} type="submit">
        {pending ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar workspace"}
      </button>
      <p className="text-center text-sm text-on-surface-variant">
        {mode === "login" ? "Ainda não tem conta? " : "Já possui conta? "}
        <Link className="font-bold text-primary" href={mode === "login" ? "/criar-conta" : "/entrar"}>
          {mode === "login" ? "Começar agora" : "Entrar"}
        </Link>
      </p>
    </form>
  );
}

function Field({ label, name, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  return (
    <label className="block text-sm font-bold text-on-surface-variant">
      {label}
      <input
        className="mt-2 w-full rounded-2xl border border-outline-variant bg-white px-4 py-3 font-medium text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        name={name}
        required
        {...props}
      />
    </label>
  );
}
