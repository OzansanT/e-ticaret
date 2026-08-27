import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dr. Animal | Günlük Pet Bakım Ürünleri",
  description:
    "Kedi ve köpekler için veteriner yaklaşımıyla geliştirilen günlük bakım ürünlerini keşfedin.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
