import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-cor-border)] bg-[var(--color-cor-surface)] mt-auto">
      <div className="max-w-[1400px] mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/discovery" className="hover:opacity-90 transition-opacity inline-flex items-center">
            <Image
              src="/images/eras-logo.png"
              alt="ERAS"
              width={65}
              height={21}
              className="h-5 w-auto object-contain select-none"
            />
          </Link>
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
