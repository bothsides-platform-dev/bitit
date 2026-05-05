export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-paper)] flex flex-col">
      {/* AuthShell header */}
      <header className="fixed top-0 left-0 right-0 flex items-center justify-between px-8 h-[var(--shell-topbar)] border-b border-[var(--color-hair)] bg-[var(--color-paper)]">
        <span className="font-mono text-[12px] tracking-[0.2em] uppercase text-[var(--color-ink)]">
          B&nbsp;&nbsp;BIDIT
        </span>
        <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-[var(--color-ink-soft)]">
          EDITION 01 · v0
        </span>
      </header>
      <main className="flex-1 flex items-start justify-center pt-[calc(var(--shell-topbar)+var(--s-11))] pb-[var(--s-11)] px-4">
        <div className="w-full max-w-[400px]">
          {children}
        </div>
      </main>
    </div>
  );
}
