import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <Link href="/" className="text-xl font-extrabold tracking-tight text-gray-900">
          Eras Studio
        </Link>
      </div>

      {/* Auth content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

      {/* Bottom decoration */}
      <div className="border-t border-gray-100 bg-white px-6 py-4 text-center">
        <p className="text-xs text-gray-400 font-medium">
          Where Art Meets Its Collector
        </p>
      </div>
    </div>
  );
}
