'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Heart,
  Hand,
  Package,
  Truck,
  ShieldCheck,
  Users,
  CheckCircle2,
  Building2,
  Sparkles,
  Utensils,
  Leaf,
  Globe2,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

export default function LandingPage() {
  const [activeRole, setActiveRole] = useState<'provider' | 'partner' | 'admin'>('provider');

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      {/* Navbar Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md transition-all">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground shadow-md shadow-primary/20">
              <span className="font-heading text-lg font-bold">S</span>
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-xl font-bold tracking-tight leading-none">SisaBaik</span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wide">Food Rescue Platform</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="font-medium text-muted-foreground hover:text-foreground">
                Masuk
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="shadow-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground">
                Daftar Gratis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 lg:py-36 overflow-hidden">
        {/* Background Decorative Radial Gradient */}
        <div className="absolute top-1/2 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[130px] pointer-events-none" />
        <div className="absolute top-10 right-10 -z-10 h-[300px] w-[300px] rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <Badge
              variant="outline"
              className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary border-primary/20 bg-primary/5 shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Misi Nol Pemborosan Makanan
            </Badge>

            <h1 className="font-heading text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-6">
              Makanan Berlebih, <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-primary via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Manfaat Lebih Banyak.
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
              Platform digital yang menghubungkan penyedia makanan berlebih (restoran, katering, toko roti, hotel, kantin)
              dengan mitra penyalur terverifikasi untuk menjaga setiap porsi makanan sampai ke orang yang membutuhkan.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto gap-2 text-base h-12 px-8 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all rounded-xl">
                  Mulai Sebagai Mitra <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base h-12 px-8 rounded-xl border-border/80">
                  Masuk ke Akun
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Real-time Impact Metrics / Social Proof */}
      <section className="py-10 border-y border-border/60 bg-muted/40">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4">
              <div className="flex justify-center mb-2 text-primary">
                <Utensils className="h-6 w-6" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold font-heading text-foreground">150.000+</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Porsi Makanan Tersalurkan</p>
            </div>

            <div className="p-4">
              <div className="flex justify-center mb-2 text-emerald-600">
                <Leaf className="h-6 w-6" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold font-heading text-foreground">45.000 kg</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Limbah Pangan Dicegah</p>
            </div>

            <div className="p-4">
              <div className="flex justify-center mb-2 text-blue-600">
                <Building2 className="h-6 w-6" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold font-heading text-foreground">320+</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Mitra Penyedia & Penyalur</p>
            </div>

            <div className="p-4">
              <div className="flex justify-center mb-2 text-teal-600">
                <Globe2 className="h-6 w-6" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold font-heading text-foreground">112 Ton</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Emisi CO₂ Dihemat</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - High Level Steps */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="mb-16 text-center">
              <Badge variant="secondary" className="mb-3">Alur Distribusi</Badge>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Dari Surplus hingga Distribusi
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
                Tiga langkah sederhana untuk mengubah makanan berlebih menjadi manfaat nyata bagi komunitas.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Step 1 */}
              <div className="group relative flex flex-col items-center text-center p-8 rounded-2xl bg-card border border-border/60 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-inner">
                  <Package className="h-8 w-8" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Langkah 01</span>
                <h3 className="font-heading text-xl font-bold mb-3">Catat Surplus</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Penyedia mencatat makanan berlebih yang masih layak konsumsi secara instan ke platform.
                </p>
              </div>

              {/* Step 2 */}
              <div className="group relative flex flex-col items-center text-center p-8 rounded-2xl bg-card border border-border/60 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-inner">
                  <Hand className="h-8 w-8" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Langkah 02</span>
                <h3 className="font-heading text-xl font-bold mb-3">Klaim oleh Mitra</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Mitra penyalur terverifikasi mengklaim donasi dan menentukan jadwal pengambilan.
                </p>
              </div>

              {/* Step 3 */}
              <div className="group relative flex flex-col items-center text-center p-8 rounded-2xl bg-card border border-border/60 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-inner">
                  <Truck className="h-8 w-8" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Langkah 03</span>
                <h3 className="font-heading text-xl font-bold mb-3">Distribusikan</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Makanan diambil tepat waktu dan langsung didistribusikan kepada penerima manfaat.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sustainable Development Goals (SDG) */}
      <section className="py-20 md:py-28 bg-muted/30 border-y border-border/60">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="mb-16 text-center">
              <Badge variant="outline" className="mb-3 border-emerald-500/30 text-emerald-600">Dampak Global</Badge>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Mendukung Tujuan Pembangunan Berkelanjutan
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
                Redistribusi makanan berlebih membantu mengurangi limbah sekaligus memperluas akses pangan.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* SDG 12 */}
              <Card className="relative overflow-hidden border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-card to-card shadow-sm hover:shadow-md transition-all">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2.5 rounded-2xl bg-emerald-500/10 shrink-0">♻️</span>
                    <div>
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 mb-1 text-[10px] uppercase font-bold">
                        SDG 12
                      </Badge>
                      <CardTitle className="text-lg sm:text-xl">Konsumsi & Produksi Bertanggung Jawab</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Mengurangi limbah makanan melalui pengelolaan surplus yang bertanggung jawab dan efisien.
                  </p>
                  <Separator className="bg-emerald-500/20" />
                  <ul className="space-y-2.5 text-sm">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>Mengurangi limbah makanan di sepanjang rantai pasokan lokal</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>Memastikan tata kelola rantai pasokan berkelanjutan</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>Mengurangi emisi gas rumah kaca dari makanan yang terbuang</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* SDG 2 */}
              <Card className="relative overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-card to-card shadow-sm hover:shadow-md transition-all">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2.5 rounded-2xl bg-amber-500/10 shrink-0">🍽️</span>
                    <div>
                      <Badge variant="outline" className="border-amber-500/40 text-amber-600 mb-1 text-[10px] uppercase font-bold">
                        SDG 2
                      </Badge>
                      <CardTitle className="text-lg sm:text-xl">Tanpa Kelaparan</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Membantu memastikan akses makanan bergizi bagi semua orang dengan mendistribusikan makanan berlebih.
                  </p>
                  <Separator className="bg-amber-500/20" />
                  <ul className="space-y-2.5 text-sm">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <span>Mengakhiri kelaparan dan memastikan akses makanan layak & aman</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <span>Mendukung penguatan ekosistem pangan lokal yang inklusif</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <span>Mengurangi kerentanan pangan pada komunitas terdampak</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Role Workflows - Interactive Selector */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 text-center">
              <Badge variant="secondary" className="mb-3">Transparansi Akses</Badge>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Cara Kerja untuk Setiap Peran
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
                Sistem yang disesuaikan dengan kebutuhan alur kerja penyedia, mitra penyalur, dan pengelola.
              </p>
            </div>

            {/* Role Switcher Controls */}
            <div className="flex justify-center mb-10">
              <div className="inline-flex p-1.5 rounded-2xl bg-muted border border-border/60 gap-1 sm:gap-2">
                <button
                  onClick={() => setActiveRole('provider')}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
                    activeRole === 'provider'
                      ? 'bg-background text-emerald-600 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Penyedia Makanan</span>
                  <span className="sm:hidden">Penyedia</span>
                </button>

                <button
                  onClick={() => setActiveRole('partner')}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
                    activeRole === 'partner'
                      ? 'bg-background text-blue-600 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Mitra Penyalur</span>
                  <span className="sm:hidden">Mitra</span>
                </button>

                <button
                  onClick={() => setActiveRole('admin')}
                  className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
                    activeRole === 'admin'
                      ? 'bg-background text-purple-600 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Admin</span>
                </button>
              </div>
            </div>

            {/* Role Cards Content */}
            <div className="max-w-3xl mx-auto">
              {activeRole === 'provider' && (
                <Card className="border-emerald-500/20 bg-card shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Penyedia Makanan</CardTitle>
                        <CardDescription>Restoran, Katering, Toko Roti, Hotel, & Kantin</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-2">
                    <div className="flex gap-4 items-start">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 font-bold text-sm">1</span>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Buat Donasi Surplus</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">Catat jumlah porsi, foto produk, batas waktu kelayakan konsumsi, serta lokasi penjemputan.</p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 font-bold text-sm">2</span>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Kelola & Konfirmasi Donasi</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">Pantau mitra terverifikasi yang mengklaim donasi, serta konfirmasi waktu pengambilan.</p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 font-bold text-sm">3</span>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Riwayat & Laporan Dampak</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">Akses analitik donasi berkala dan metrik kontribusi pengurangan jejak karbon usaha Anda.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeRole === 'partner' && (
                <Card className="border-blue-500/20 bg-card shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600">
                        <Users className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Mitra Penyalur</CardTitle>
                        <CardDescription>LSM, Bank Makanan, Yayasan, & Komunitas</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-2">
                    <div className="flex gap-4 items-start">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 font-bold text-sm">1</span>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Daftar & Verifikasi</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">Registrasi identitas organisasi Anda dan tunggu proses peninjauan kredibilitas oleh admin.</p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 font-bold text-sm">2</span>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Cari & Klaim Donasi</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">Filter donasi makanan tersedia berdasarkan jarak terdekat, jumlah porsi, dan jenis katering.</p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 font-bold text-sm">3</span>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Distribusi & Konfirmasi</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">Jemput makanan sesuai jadwal dan tandai penyerahan bantuan selesai secara real-time.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeRole === 'admin' && (
                <Card className="border-purple-500/20 bg-card shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Admin Platform</CardTitle>
                        <CardDescription>Verifikator Keamanan & Pengelola Ekosistem</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-2">
                    <div className="flex gap-4 items-start">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 font-bold text-sm">1</span>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Verifikasi Organisasi</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">Tinjau kelayakan legalitas dan standar keamanan porsi bagi calon mitra penyalur baru.</p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 font-bold text-sm">2</span>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Kelola & Monitor Ekosistem</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">Pantau kelancaran transaksi, kepatuhan standar higienis, serta respon kendala di lapangan.</p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 font-bold text-sm">3</span>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Laporan Agregat Lintas Sektor</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">Ekspor statistik pertumbuhan jejaring dan metrik akumulasi dampak limbah pangan nasional.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Target Ecosystem Cards */}
      <section className="py-20 md:py-28 bg-muted/20 border-t border-border/60">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="mb-16 text-center">
              <Badge variant="outline" className="mb-3">Ekosistem Pangan</Badge>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Untuk Siapa Platform Ini?
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
                SisaBaik didesain untuk ekosistem pangan yang berkelanjutan, dari penyedia hingga penerima manfaat.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="border-border/60 shadow-sm hover:shadow-md transition-all">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 mb-4">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Penyedia Makanan</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Restoran, katering, toko roti, hotel, dan kantin yang ingin mengelola surplus makanan
                    secara bertanggung jawab dan efisien.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm hover:shadow-md transition-all">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 mb-4">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Mitra Penyalur</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    LSM, bank makanan, yayasan, dan komunitas terverifikasi yang secara aktif mendistribusikan
                    bantuan ke penerima sasaran.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm hover:shadow-md transition-all">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 mb-4">
                    <Heart className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Masyarakat Penerima</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Menerima manfaat pangan berkualitas tinggi yang masih sangat layak konsumsi, menekan tingkat kerentanan gizi.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section className="relative py-20 md:py-28 bg-gradient-to-br from-primary via-emerald-700 to-teal-800 text-primary-foreground overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-96 w-96 rounded-full bg-black/20 blur-3xl pointer-events-none" />

        <div className="container relative z-10 mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight mb-6">
              Siap Bergabung dalam Misi Ini?
            </h2>
            <p className="text-primary-foreground/90 text-base sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              Bergabunglah dengan ratusan organisasi yang telah berkontribusi mengurangi pemborosan makanan
              dan mendukung ketercapaian SDG 12 serta SDG 2.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="bg-background text-foreground hover:bg-background/90 w-full sm:w-auto h-12 px-8 font-semibold rounded-xl shadow-lg">
                  Daftar Gratis Sekarang
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 rounded-xl">
                  Sudah Punya Akun?
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="font-heading text-xs font-bold">S</span>
              </div>
              <span className="font-heading text-base font-bold tracking-tight">SisaBaik</span>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              &copy; {new Date().getFullYear()} SisaBaik. Platform redistribusi makanan berlebih Indonesia.
            </p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">Kebijakan Privasi</Link>
              <Separator orientation="vertical" className="h-4" />
              <Link href="/" className="hover:text-foreground transition-colors">Syarat Layanan</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}