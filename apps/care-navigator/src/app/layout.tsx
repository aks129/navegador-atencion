import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Care Navigator — Navegador de Salud',
  description: 'Bilingual visit preparation for safety-net patients',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
