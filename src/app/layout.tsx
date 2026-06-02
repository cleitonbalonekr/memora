import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Memora - Flashcards with AI",
  description: "Create and study double-sided active recall cards with AI assistance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-on-background">
        {children}
      </body>
    </html>
  );
}
