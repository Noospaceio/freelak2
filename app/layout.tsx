import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '$FREELAK — FreeLakito | Solana',
  description: 'The coin launched from open prison. 22,222 supply. Solana.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: '$FREELAK — FreeLakito',
    description: 'The coin launched from open prison. 22,222 supply. Solana.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
