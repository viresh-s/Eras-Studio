import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-offwhite flex flex-col">
      {/* Top bar */}
      <div className="border-b-4 border-brand-black bg-white px-6 py-4">
        <Link href="/" className="font-heading text-2xl font-bold tracking-tight">
          ERAS<span className="text-brand-yellow">.</span>
        </Link>
      </div>

      {/* Auth content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

      {/* Bottom decoration */}
      <div className="border-t-4 border-brand-black bg-brand-yellow px-6 py-3 text-center">
        <p className="font-heading text-sm font-semibold">
          Where Art Meets Its Collector
        </p>
      </div>
    </div>
  );
}
