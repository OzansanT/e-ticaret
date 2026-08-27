import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import { ConsentManager } from "@/features/engagement/consent-manager";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://e-ticaret.talasresul.chatgpt.site"),
  title: "Lorem Ipsum | Dolor Sit Amet",
  description:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#ff7b00",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="antialiased">
        {children}
        <ConsentManager />
        <Toaster position="bottom-center" richColors />
      </body>
    </html>
  );
}
