import type { Metadata, Viewport } from 'next';
import { Nunito, Fira_Code } from 'next/font/google';
import './globals.css';
import { Analytics } from "@vercel/analytics/next"

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-nunito',
  display: 'swap',
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-fira',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Nivel 2 🐱',
  description: 'Bienvenida al Nivel 2... ahora sí, sin filtros.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f7f3ff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${nunito.variable} ${firaCode.variable}`}>
      <body className={nunito.className}>{children}<Analytics /></body>
    </html>
  );
}
