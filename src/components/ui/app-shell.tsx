"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { LayoutDashboard, Loader2, LogOut, Package, Plus, ShieldCheck, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Logo } from './logo';
import { ThemeToggle } from './theme-toggle';

type UserRole = 'provider' | 'partner' | 'admin';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  isActive: (pathname: string) => boolean;
}

interface AppShellProps {
  children: React.ReactNode;
  userRole: UserRole;
}

const startsWith = (prefix: string) => (pathname: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

// Only real destinations are listed: every item below leads to a page that exists.
const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  provider: [
    { href: '/provider/dashboard', label: 'Beranda', icon: LayoutDashboard, isActive: startsWith('/provider/dashboard') },
    {
      href: '/provider/donations',
      label: 'Donasi saya',
      icon: Package,
      isActive: (p) => startsWith('/provider/donations')(p) && !startsWith('/provider/donations/new')(p),
    },
    { href: '/provider/donations/new', label: 'Buat donasi', icon: Plus, isActive: startsWith('/provider/donations/new') },
  ],
  partner: [
    { href: '/partner/dashboard', label: 'Beranda', icon: LayoutDashboard, isActive: startsWith('/partner/dashboard') },
    { href: '/partner/donations', label: 'Donasi tersedia', icon: Package, isActive: startsWith('/partner/donations') },
    { href: '/partner/orders', label: 'Pesanan saya', icon: ShoppingBag, isActive: startsWith('/partner/orders') },
  ],
  admin: [
    { href: '/admin/verification', label: 'Verifikasi mitra', icon: ShieldCheck, isActive: startsWith('/admin/verification') },
  ],
};

const ROLE_LABEL: Record<UserRole, string> = {
  provider: 'Penyedia makanan',
  partner: 'Mitra penyalur',
  admin: 'Admin',
};

export function AppShell({ children, userRole }: AppShellProps) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const items = NAV_ITEMS[userRole];

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
      router.push('/login');
      router.refresh();
    } catch {
      toast.error('Gagal keluar dari akun. Coba lagi.');
      setSigningOut(false);
    }
  };

  const signOutLabel = signingOut ? 'Sedang keluar...' : 'Keluar';

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Lewati ke konten utama
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center px-6">
          <Link href={items[0].href} aria-label="SisaBaik, ke beranda" className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
            <Logo />
          </Link>
        </div>

        <nav aria-label="Menu utama" className="flex-1 space-y-1 px-3 py-4">
          {items.map((item) => {
            const active = item.isActive(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-11 items-center gap-3 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="size-[18px]" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-sidebar-border p-3">
          <div className="flex items-center justify-between gap-2 px-3 py-1">
            <p className="text-sm font-semibold text-foreground">{ROLE_LABEL[userRole]}</p>
            <ThemeToggle />
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex h-11 w-full items-center gap-3 rounded-full px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
          >
            {signingOut ? <Loader2 className="size-[18px] animate-spin" aria-hidden="true" /> : <LogOut className="size-[18px]" aria-hidden="true" />}
            {signOutLabel}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-background px-4 lg:hidden">
        <Link href={items[0].href} aria-label="SisaBaik, ke beranda" className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
          <Logo className="text-lg" />
        </Link>
        <div className="flex items-center">
          <ThemeToggle />
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            aria-label={signOutLabel}
            className="inline-flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
          >
            {signingOut ? <Loader2 className="size-[18px] animate-spin" aria-hidden="true" /> : <LogOut className="size-[18px]" aria-hidden="true" />}
          </button>
        </div>
      </header>

      <div className="lg:pl-64">
        <main
          id="konten"
          tabIndex={-1}
          className={cn(
            'mx-auto w-full max-w-6xl px-4 py-6 outline-none sm:px-6 lg:px-10 lg:py-10',
            items.length > 1 ? 'pb-28 lg:pb-10' : 'pb-10',
          )}
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation: thumb-sized targets, only when there is more than one destination */}
      {items.length > 1 && (
        <nav
          aria-label="Menu utama"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
        >
          <ul className="flex">
            {items.map((item) => {
              const active = item.isActive(pathname);
              const Icon = item.icon;
              return (
                <li key={item.href} className="flex-1">
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                      active ? 'text-primary' : 'text-muted-foreground',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-7 w-14 items-center justify-center rounded-full transition-colors',
                        active ? 'bg-fresh-soft' : 'bg-transparent',
                      )}
                    >
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}
