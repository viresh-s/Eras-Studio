import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="max-w-[1400px] mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-extrabold text-gray-900">Eras</span>
          <span className="text-sm font-normal text-gray-900">Studio</span>
          <span className="text-xs text-gray-400 ml-2">· All eyes. A single perspective.</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/discovery" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
            Explore galleries →
          </Link>
          <span className="text-xs text-gray-400">
            About our creators · Terms of use
          </span>
        </div>
      </div>
    </footer>
  );
}
