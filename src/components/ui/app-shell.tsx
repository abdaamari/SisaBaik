"use client";

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface AppShellProps {
  children: React.ReactNode;
  userRole?: 'provider' | 'partner' | 'admin' | null;
  isVerified?: boolean;
}

export function AppShell({ children, userRole, isVerified }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-card shadow-[4px_0_24px_rgba(41,45,40,0.06)] transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between gap-3 border-b border-border px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <span className="font-heading text-[15px] font-normal tracking-tight">S</span>
              </div>
              <div className="leading-none">
                <p className="font-heading text-[15px] font-normal tracking-tight text-foreground">SisaBaik</p>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Makanan berlebih</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-5">
            <button className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground">
              Beranda
            </button>
            <button className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground">
              Profil
            </button>
            <button className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground">
              Pengaturan
            </button>
            {userRole === 'provider' && (
              <>
                <button className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground">
                  Donasi Saya
                </button>
                <button className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground">
                  Tambah Donasi
                </button>
                <button className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground">
                  Riwayat
                </button>
              </>
            )}
            {userRole === 'partner' && (
              <>
                <button className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground">
                  Donasi Tersedia
                </button>
                <button className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground">
                  Pesanan Saya
                </button>
                <button className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground">
                  Riwayat Pesanan
                </button>
              </>
            )}
            {userRole === 'admin' && (
              <>
                <button className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground">
                  Verifikasi
                </button>
                <button className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground">
                  Kelola Pengguna
                </button>
                <button className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground">
                  Laporan
                </button>
              </>
            )}
          </nav>

          {/* User info and theme toggle */}
          <div className="border-t border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {userRole?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">User</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {userRole === 'partner' && !isVerified && 'Belum diverifikasi'}
                    {userRole === 'partner' && isVerified && 'Terverifikasi'}
                    {userRole !== 'partner' && 'Aktif'}
                  </p>
                </div>
              </div>
              {userRole === 'partner' && !isVerified && (
                <span className="px-2 py-1 bg-destructive/10 text-destructive text-xs rounded">
                  Unverified
                </span>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 bg-background/80 backdrop-blur-md border-b border-border px-4 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">
              {/* Page title will be set by page components */}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme toggle placeholder */}
            <button onClick={() => {
              const html = document.documentElement;
              html.classList.toggle('dark');
            }} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <span className="sr-only">Toggle theme</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}