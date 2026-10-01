import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function SystemLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session) redirect("/entrar");
  const membership = await db.membership.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
    include: { organization: true, storeAccess: { include: { store: true } } },
  });
  if (!membership) redirect("/entrar");

  return <AppShell organization={membership.organization.name} store={membership.storeAccess[0]?.store.name ?? "Todas as lojas"} user={session.user.name}>{children}</AppShell>;
}
