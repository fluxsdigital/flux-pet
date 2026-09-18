import type { ReactNode } from "react";

export function Icon({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{children}</span>;
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`${compact ? "h-8 w-8 rounded-lg" : "h-10 w-10 rounded-xl"} flex items-center justify-center bg-primary-container text-on-primary shadow-[0_8px_24px_-4px_rgba(255,95,21,0.35)]`}>
        <Icon className={compact ? "text-[18px]" : "text-[22px]"}>pets</Icon>
      </span>
      <span className={`${compact ? "text-title-md" : "text-headline-sm"} font-extrabold tracking-tight text-on-surface`}>
        FLUX <span className="text-primary">PET</span>
      </span>
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="mb-space-xs block text-label-sm font-bold uppercase tracking-widest text-primary">{children}</span>;
}

export function PrimaryLink({ children, href = "#quero-conhecer" }: { children: ReactNode; href?: string }) {
  return (
    <a className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-container px-space-xl py-4 text-label-lg font-semibold text-on-primary shadow-[0_8px_24px_-4px_rgba(255,95,21,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary" href={href}>
      {children}<Icon className="text-[20px]">arrow_forward</Icon>
    </a>
  );
}
