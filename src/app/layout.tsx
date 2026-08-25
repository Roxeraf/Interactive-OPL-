import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Klarpunkt — Digitale Offene-Punkte-Liste",
  description:
    "Interaktive OPL nach Vorlage V5.0: Protokollierung, Kundenrechte, modernes Lagebild statt Excel-Tabelle.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-canvas text-ink">{children}</body>
    </html>
  );
}
