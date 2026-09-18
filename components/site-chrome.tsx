import { Brand } from "./ui";

const links = [
  ["Recursos", "#recursos"],
  ["Como funciona", "#como-funciona"],
  ["FAQ", "#faq"],
] as const;

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-surface-dim/40 bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-margin-mobile md:px-margin">
        <a href="#recursos" aria-label="Flux Pet — início"><Brand /></a>
        <nav className="hidden items-center gap-space-lg md:flex" aria-label="Navegação principal">
          {links.map(([label, href], index) => <a className={index === 0 ? "font-bold text-primary" : "text-label-lg font-semibold text-on-surface-variant transition-colors hover:text-on-surface"} href={href} key={href}>{label}</a>)}
        </nav>
        <a className="rounded-full bg-primary-container px-space-lg py-space-sm text-label-lg font-semibold text-on-primary shadow-[0_8px_24px_-4px_rgba(255,95,21,0.35)] transition-all hover:-translate-y-0.5 hover:bg-primary" href="#quero-conhecer">Quero conhecer</a>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="w-full border-t border-surface-dim/40 bg-surface-container-low">
      <div className="mx-auto max-w-[1440px] px-margin-mobile py-space-xl md:px-margin">
        <div className="flex flex-col items-center justify-between gap-space-lg border-b border-surface-dim/30 pb-space-lg md:flex-row">
          <div className="flex flex-col items-center gap-space-md text-center sm:flex-row sm:text-left"><Brand compact /><span className="hidden text-surface-dim sm:inline">|</span><p className="text-body-md text-on-surface-variant">Gestão inteligente para pet shops.</p></div>
          <nav className="flex flex-wrap items-center justify-center gap-space-md sm:gap-space-lg" aria-label="Navegação do rodapé">
            {links.map(([label, href]) => <a className="text-body-sm text-on-surface-variant transition-colors hover:text-on-surface" href={href} key={href}>{label}</a>)}
            <a className="text-body-sm text-on-surface-variant transition-colors hover:text-on-surface" href="#quero-conhecer">Contato</a>
          </nav>
        </div>
        <div className="flex flex-col items-center justify-between gap-space-sm pt-space-md text-center sm:flex-row sm:text-left">
          <p className="text-body-sm text-on-surface-variant">© 2026 Flux Soluções Digitais Ltda. Todos os direitos reservados.</p>
          <p className="text-label-sm uppercase tracking-wider text-outline">Tecnologia Veterinária &amp; Concierge</p>
        </div>
      </div>
    </footer>
  );
}
