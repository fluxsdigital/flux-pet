import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ExecutiveDashboard } from "@/components/executive-dashboard";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session) redirect("/entrar");
  return <ExecutiveDashboard name={session.user.name} />;
}
