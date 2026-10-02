import type { Metadata } from "next";

import { DemoShell } from "@/components/demo-shell";

export const metadata: Metadata = { title: "Demonstração | Flux Pet", robots: { index: false, follow: false } };

export default function DemonstrationLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <DemoShell>{children}</DemoShell>;
}
