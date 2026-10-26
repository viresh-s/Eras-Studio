import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Eras Studio — Art Marketplace",
  description: "Discover and collect extraordinary artworks from talented creators worldwide. Eras Studio connects artists with collectors.",
  keywords: ["art", "marketplace", "paintings", "collectors", "artists", "gallery"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full antialiased ${poppins.variable}`} suppressHydrationWarning>
      <body className={`min-h-full flex flex-col ${poppins.className}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
