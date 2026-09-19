"use client";

import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      className="rounded-full border border-outline-variant px-4 py-2 text-sm font-bold text-on-surface-variant"
      onClick={async () => {
        await authClient.signOut();
        router.push("/entrar");
        router.refresh();
      }}
      type="button"
    >
      Sair
    </button>
  );
}
