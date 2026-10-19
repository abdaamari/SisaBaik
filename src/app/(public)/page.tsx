import Link from 'next/link';
import { ArrowRight, Hand, Package, Truck } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { buttonVariants } from '@/components/ui/button';
import { LiveBoard } from '@/components/landing/live-board';
import { RoleTabs } from '@/components/landing/role-tabs';
import { cn } from '@/lib/utils';

const STEPS = [
  {
    icon: Package,
    title: 'Penyedia mencatat',
    text: 'Restoran atau katering mengisi makanan yang tersisa, jumlahnya, dan batas waktu layak konsumsinya.',
  },
  {
    icon: Hand,
    title: 'Mitra mengklaim',
    text: 'Mitra penyalur terverifikasi memilih donasi yang bisa dijemput. Satu donasi hanya bisa diklaim satu mitra.',
  },
  {
    icon: Truck,
    title: 'Makanan sampai',
    text: 'Mitra menjemput dan menyalurkannya. Setiap tahap tercatat, dari klaim sampai selesai.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#utama"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Lewati ke konten utama
      </a>

      <header className="sticky top-0 z-50 bg-background/95">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="SisaBaik, ke beranda" className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
            <Logo />
          </Link>
          <nav aria-label="Menu utama" className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Link href="/login" className={buttonVariants({ variant: 'ghost' })}>
              Masuk
            </Link>
            <Link href="/register" className={buttonVariants()}>
              Daftar
            </Link>
          </nav>
        </div>
      </header>

      <main id="utama">
        {/* Hero: the headline, and the thing it is about, side by side */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-8 pb-16 sm:px-6 md:pt-14 md:pb-24 lg:grid-cols-[1fr_minmax(0,28rem)] lg:gap-16">
          <div className="animate-rise">
            <h1 className="font-heading text-5xl leading-[1.05] font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
              Jangan buang yang masih baik.
            </h1>
            <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-foreground/80">
              SisaBaik mempertemukan restoran, katering, dan toko roti yang punya makanan berlebih dengan mitra
              penyalur terverifikasi, sebelum batas layak konsumsinya habis.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className={cn(buttonVariants({ size: 'lg' }), 'sm:w-auto')}>
                Daftar gratis
                <ArrowRight aria-hidden="true" />
              </Link>
              <Link href="/login" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'sm:w-auto')}>
                Masuk ke akun
              </Link>
            </div>
          </div>

          <div className="animate-rise [animation-delay:120ms]">
            <LiveBoard />
          </div>
        </section>

        {/* The three stages, as a field of colour */}
        <section className="bg-primary text-primary-foreground">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
            <h2 className="max-w-[20ch] font-heading text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-5xl">
              Dari dapur sampai ke penerima.
            </h2>
            <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              {STEPS.map((step) => (
                <li key={step.title}>
                  <span className="flex size-12 items-center justify-center rounded-full bg-primary-foreground text-primary">
                    <step.icon className="size-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-xl font-bold">{step.title}</h3>
                  <p className="mt-2 max-w-[36ch] text-base leading-relaxed text-primary-foreground/90">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Roles */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
          <h2 className="max-w-[22ch] font-heading text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-5xl">
            Tugas Anda di SisaBaik.
          </h2>
          <p className="mt-4 max-w-[52ch] text-lg leading-relaxed text-foreground/80">
            Setiap peran melihat menu dan halaman yang berbeda. Pilih peran untuk melihat apa yang bisa dikerjakan.
          </p>
          <div className="mt-10">
            <RoleTabs />
          </div>
        </section>

        {/* Why */}
        <section className="bg-secondary">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="max-w-[18ch] font-heading text-4xl leading-[1.1] font-extrabold tracking-tight sm:text-5xl">
                Dua tujuan, satu piring.
              </h2>
              <p className="mt-4 max-w-[46ch] text-lg leading-relaxed text-foreground/80">
                Makanan layak yang terbuang adalah dua masalah sekaligus. SisaBaik dibuat untuk menjawab keduanya.
              </p>
            </div>
            <dl className="space-y-8">
              <div>
                <dt className="text-xl font-bold">SDG 12: konsumsi dan produksi yang bertanggung jawab</dt>
                <dd className="mt-2 max-w-[52ch] text-base leading-relaxed text-foreground/80">
                  Makanan berlebih disalurkan, bukan dibuang. Limbah pangan berkurang sejak dari sumbernya.
                </dd>
              </div>
              <div>
                <dt className="text-xl font-bold">SDG 2: tanpa kelaparan</dt>
                <dd className="mt-2 max-w-[52ch] text-base leading-relaxed text-foreground/80">
                  Makanan yang masih layak sampai ke orang yang membutuhkannya, lewat mitra yang sudah diverifikasi.
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Close */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
          <h2 className="max-w-[16ch] font-heading text-5xl leading-[1.05] font-extrabold tracking-tight sm:text-6xl md:text-7xl">
            Masih ada yang tersisa hari ini?
          </h2>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className={cn(buttonVariants({ size: 'lg' }), 'sm:w-auto')}>
              Daftar gratis
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link href="/login" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'sm:w-auto')}>
              Saya sudah punya akun
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-foreground text-background">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <p className="font-heading text-5xl leading-none font-extrabold tracking-tight sm:text-7xl md:text-8xl">
            SisaBaik
          </p>
          <p className="mt-6 text-sm text-background/80">
            Platform redistribusi makanan berlebih untuk Indonesia. &copy; 2026 SisaBaik.
          </p>
        </div>
      </footer>
    </div>
  );
}
