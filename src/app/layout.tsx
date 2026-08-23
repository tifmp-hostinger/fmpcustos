import type { Metadata } from "next";
import { Noto_Serif, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--fonte-sans",
  display: "swap",
});

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  variable: "--fonte-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Custos FMP",
  description: "Plataforma corporativa de inteligência de custos da FMP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} ${notoSerif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
