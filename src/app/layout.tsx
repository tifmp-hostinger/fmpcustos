import type { Metadata } from "next";
import { Noto_Serif, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--fonte-sans",
  display: "swap",
});

/*
 * O eixo itálico do Noto Serif.
 *
 * A manchete em serifa ITÁLICA é o gesto assinatura da FMP — está no logotipo,
 * no site, em cada número grande do sistema de design. A plataforma carregava
 * só o eixo vertical, então esse gesto era literalmente impossível de escrever
 * aqui: pedir itálico ao navegador produzia uma inclinação sintética, que é a
 * fonte torta, não a fonte itálica.
 *
 * O TTF que a FMP entrega em `design-system/fonts/` também é só o mestre
 * vertical; o eixo itálico verdadeiro vem do Google Fonts. O `next/font` baixa
 * e serve do nosso domínio no build, então não sobra requisição externa em
 * tempo de execução.
 */
const notoSerif = Noto_Serif({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--fonte-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Custos FMP",
  description: "Plataforma corporativa de inteligência de custos da FMP",
  applicationName: "Custos FMP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} ${notoSerif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
