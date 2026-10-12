import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-cor-border)] bg-[var(--color-cor-surface)] mt-auto">
      <div className="max-w-[1400px] mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[var(--color-cor-ink)] font-serif italic">Eras</span>
          <span className="text-sm font-normal text-[var(--color-cor-ink)] font-serif">Studio</span>
          <span className="text-xs text-[var(--color-cor-ink-light)] ml-2">· All eyes. A single perspective.</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/discovery" className="text-xs text-[var(--color-cor-ink-light)] hover:text-[var(--color-cor-ink)] transition-colors">
            Explore galleries →
          </Link>
          <span className="text-xs text-[var(--color-cor-ink-light)]">
            About our creators · Terms of use
          </span>
        </div>
      </div>
    </footer>
  );
}
