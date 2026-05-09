import { Logo } from '@/components/primitives/Logo';
import { Footer } from '@/components/shell/Footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--md-sys-color-surface)] flex flex-col">
      {/* AuthShell header */}
      <header className="fixed top-0 left-0 right-0 flex items-center justify-between px-8 h-[var(--shell-topbar)] border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
        <Logo />
      </header>
      <main className="flex-1 flex items-start justify-center pt-[calc(var(--shell-topbar)+var(--s-11))] pb-[var(--s-11)] px-4">
        <div className="w-full max-w-[400px]">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
