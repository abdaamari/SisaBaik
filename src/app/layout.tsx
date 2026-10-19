import './globals.css';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { ToastProvider } from '@/components/ui/toast-provider';

// Plus Jakarta Sans was drawn for Jakarta's city identity: a fitting voice for an Indonesian product.
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});

export const metadata: Metadata = {
  title: 'SisaBaik - Jangan buang yang masih baik',
  description: 'Platform yang menghubungkan penyedia makanan berlebih dengan mitra penyalur terverifikasi, sebelum makanannya kedaluwarsa. Mendukung SDG 12 dan SDG 2.',
};

// Runs before first paint so the saved theme never flashes.
const themeInitScript = `try{var t=localStorage.getItem('sisabaik-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${jakarta.variable} font-sans antialiased`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
