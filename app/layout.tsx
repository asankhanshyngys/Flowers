import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  icons: { icon: '/favicon.svg' },
  title: 'Petal & Stem — цветочная коллекция',
  description:
    'Цветы для важных событий и маленьких радостей. Откройте коллекцию букетов Petal & Stem.',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
