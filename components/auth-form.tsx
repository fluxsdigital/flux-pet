"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useSyncExternalStore } from "react";

import { authClient } from "@/lib/auth-client";
import { loginError, onboardingError } from "@/lib/auth-feedback";
import type { ApiErrorPayload, FieldErrors } from "@/lib/auth-feedback";

type Mode = "login" | "onboarding";
const subscribeToHydration = () => () => {};

export function AuthForm({ mode, accountCreated = false }: { mode: Mode; accountCreated?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setFieldErrors({});
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    if (mode === "onboarding") {
      try {
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
          const body = await response.json().catch(() => ({})) as ApiErrorPayload;
          const feedback = onboardingError(body, response.status);
          setError(feedback.message);
          setFieldErrors(feedback.fields);
          setPending(false);
          return;
        }
        router.replace("/entrar?cadastro=sucesso");
        return;
      } catch {
        setError("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.");
        setPending(false);
        return;
      }
    }

    try {
      const result = await authClient.signIn.email({ email, password });
      if (result.error) {
        setError(loginError(result.error));
        setPending(false);
        return;
      }
    } catch {
      setError("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.");
      setPending(false);
      return;
    }
    router.replace("/sistema");
    router.refresh();
  }

  return (
    <form className="mt-space-lg space-y-space-sm" method="post" noValidate onSubmit={submit}>
      {mode === "login" && accountCreated && (
        <p className="rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-800" role="status">
          Workspace criado com sucesso. Entre com o e-mail e a senha cadastrados.
        </p>
      )}
      {mode === "onboarding" && (
        <>
          <Field error={fieldErrors.ownerName} label="Seu nome" name="ownerName" autoComplete="name" />
          <Field error={fieldErrors.organizationName} label="Nome do pet shop" name="organizationName" autoComplete="organization" />
          <Field error={fieldErrors.storeName} label="Nome da primeira loja" name="storeName" autoComplete="organization-title" />
        </>
      )}
      <Field error={fieldErrors.email} label="E-mail" name="email" type="email" autoComplete="email" />
      <Field error={fieldErrors.password} label="Senha" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={10} />
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert" aria-live="assertive">{error}</p>}
      <button className="w-full rounded-full bg-primary px-6 py-3 font-bold text-white disabled:opacity-60" disabled={pending || !hydrated} type="submit">
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

function Field({ label, name, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; error?: string }) {
  const errorId = `${name}-error`;
  return (
    <label className="block text-sm font-bold text-on-surface-variant">
      {label}
      <input
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        className="mt-2 w-full rounded-2xl border border-outline-variant bg-white px-4 py-3 font-medium text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        name={name}
        required
        {...props}
      />
      {error && <span className="mt-1 block text-sm font-semibold text-red-700" id={errorId}>{error}</span>}
    </label>
  );
}
