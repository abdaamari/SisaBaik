import './globals.css';
import type { Metadata } from 'next';
import { Inter, Instrument_Serif } from 'next/font/google';
import { ToastProvider } from '@/components/ui/toast-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-instrument-serif',
  display: 'swap',
  fallback: ['Georgia', 'serif'],
});

export const metadata: Metadata = {
  title: 'SisaBaik - Makanan Berlebih, Manfaat Lebih',
  description: 'Platform digital yang menghubungkan penyedia makanan berlebih dengan mitra penyalur terverifikasi untuk mendukung SDG 12 dan SDG 2.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} ${instrumentSerif.variable} font-sans antialiased`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
