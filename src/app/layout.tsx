import type { Metadata } from "next";
import { Spectral } from "next/font/google";
import "./globals.css";
import { ENV } from "@/env";

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: ENV.NEXT_PUBLIC_APP_NAME,
  description:
    "O ecossistema de Inteligência Aplicada que conecta pessoas, ideias e ferramentas para transformar conceitos em realidade. Crie, valide, comunique e monetize com eficiência e autonomia.",
  keywords: [
    "DSCVR",
    "Ecossistema DSCVR",
    "Inteligência Aplicada",
    "Omnisight",
    "Concilium",
    "DSCVR Space",
    "DSCVR Sales",
    "DSCVR ID",
    "Validação de ideias",
    "Conselhos de inteligência",
    "Criação independente",
    "IA criativa",
    "Produtividade inteligente",
    "Ferramentas integradas",
    "Créditos unificados",
    "Autonomia criativa",
    "Empreendedorismo digital",
  ],
  openGraph: {
    type: "website",
    siteName: "DSCVR",
    locale: "pt_BR",
    url: ENV.AUTH_URL,
    title: "DSCVR – Inteligência Aplicada em Movimento",
    description:
      "Um ecossistema de inteligência aplicada que une criação, validação, aprendizado e monetização. Conecte suas ideias a um fluxo integrado de ferramentas e mentes inteligentes.",
    images: [
      {
        url: ENV.AUTH_URL + "/logo-dark.png",
        width: 1584,
        height: 600,
        alt: "DSCVR",
      },
    ],
  },
  authors: [
    {
      name: "Lucas Craveiro Paes",
      url: "https://github.com/lucascraveiropaes",
    },
  ],
  creator: "Lucas Craveiro Paes",
  // icons: [
  //   {
  //     rel: "icon",
  //     url: ENV.AUTH_URL + "/favicon.ico",
  //   },
  // ],
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" className="light">
      <body className={`${spectral.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
