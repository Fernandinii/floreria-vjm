import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://floreria-vjm.vercel.app'),
  title: "Florería VJM | Ramos y Arreglos Florales en Villahermosa, Tabasco",
  description: "Envía flores frescas, ramos buchones, rosas y arreglos florales en Villahermosa, Tabasco. Pedidos rápidos y seguros por WhatsApp. ¡Sorprende hoy!",
  keywords: ["Florería en Villahermosa", "Ramos buchones Tabasco", "Arreglos florales Villahermosa", "Flores a domicilio Villahermosa", "Florería VJM"],
  icons: {
    icon: '/favicon.png',
  },
  openGraph: {
    title: "Florería VJM | Ramos y Arreglos Florales en Villahermosa",
    description: "Diseños florales únicos y ramos frescos con envío a domicilio en Villahermosa, Tabasco. ¡Haz tu pedido fácil y rápido!",
    url: 'https://floreria-vjm.vercel.app',
    siteName: 'Florería VJM',
    locale: 'es_MX',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Florería VJM | Ramos y Arreglos Florales en Villahermosa",
    description: "Envía flores frescas y arreglos florales en Villahermosa, Tabasco.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
