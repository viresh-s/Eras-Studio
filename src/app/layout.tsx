import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eras Studio — Art Marketplace",
  description: "Discover and collect extraordinary artworks from talented creators worldwide. Eras Studio connects artists with collectors.",
  keywords: ["art", "marketplace", "paintings", "collectors", "artists", "gallery"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
