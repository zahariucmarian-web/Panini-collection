import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Panini 2026 Sticker Tracker",
  description: "Monitorizează-ți stickerele de la Cupa Mondială Panini 2026 cu sincronizare automată în cloud și listă de schimb instant.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body className="antialiased min-h-screen flex flex-col bg-[#f7f5ee]">
        {children}
      </body>
    </html>
  );
}
