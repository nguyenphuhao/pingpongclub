import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dokifree Backend',
  description: 'Next.js backend architecture ready for NestJS migration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

