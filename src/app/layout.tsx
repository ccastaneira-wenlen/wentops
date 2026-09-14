import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "./Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WENTOP - Tarjeta de Observación Preventiva",
  description: "Plataforma web para gestión de Wentops de Wenlen S.A.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.className} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#121212" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <Navbar />
          <main style={{ flex: 1 }}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}

