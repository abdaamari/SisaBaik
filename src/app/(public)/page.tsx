import Link from "next/link";
import { ArrowRight, Hand, Package, Truck } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Reveal, RevealLines, LoopReveal } from "@/components/ui/reveal";
import { LiveBoard } from "@/components/landing/live-board";

const CONTAINER = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";
const SECTION_Y = "py-16 sm:py-20 lg:py-28";

const STEPS = [
  {
    icon: Package,
    title: "Penyedia mencatat",
    text: "Restoran atau katering mengisi makanan yang tersisa, jumlahnya, dan batas waktu layak konsumsinya.",
  },
  {
    icon: Hand,
    title: "Mitra mengklaim",
    text: "Mitra penyalur terverifikasi memilih donasi yang bisa dijemput. Satu donasi hanya bisa diklaim satu mitra.",
  },
  {
    icon: Truck,
    title: "Makanan sampai",
    text: "Mitra menjemput dan menyalurkannya. Setiap tahap tercatat, dari klaim sampai selesai.",
  },
];

const GOALS = [
  {
    icon: Hand,
    label: "SDG 12",
    text: "Konsumsi dan produksi yang bertanggung jawab",
  },
  { icon: Package, label: "SDG 2", text: "Tanpa kelaparan" },
];

const SLOGANS = [
  "SisaBaik — Jangan buang yang masih baik.",
  "Dari dapur sampai ke penerima, sebelum waktu habis.",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#utama"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-full focus:bg-primary focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Lewati ke konten utama
      </a>

      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className={cn(CONTAINER, "flex h-16 items-center justify-between")}>
          <Link
            href="/"
            aria-label="SisaBaik, ke beranda"
            className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <Logo />
          </Link>
          <nav
            aria-label="Menu utama"
            className="flex items-center gap-1 sm:gap-2"
          >
            <ThemeToggle />
            <Link
              href="/login"
              className={buttonVariants({ variant: "ghost" })}
            >
              Masuk
            </Link>
            <Link href="/register" className={buttonVariants()}>
              Daftar
            </Link>
          </nav>
        </div>
      </header>

      <main id="utama">
        {/* Hero: text left, image right on desktop; stacked on mobile */}
        <section
          className={cn(CONTAINER, "pt-12 pb-16 sm:pb-20 lg:pt-20 lg:pb-28")}
        >
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_minmax(0,28rem)] lg:gap-16">
            <div>
              <RevealLines delayIndex={0} className="space-y-1">
                <div className="font-heading text-5xl leading-[1.05] font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                  Jangan buang
                </div>
                <div className="font-heading text-5xl leading-[1.05] font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                  yang masih baik.
                </div>
              </RevealLines>
              <Reveal delayIndex={2}>
                <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-foreground/70">
                  SisaBaik mempertemukan restoran, katering, dan toko roti yang
                  punya makanan berlebih dengan mitra penyalur terverifikasi,
                  sebelum batas layak konsumsinya habis.
                </p>
              </Reveal>
              <Reveal
                delayIndex={4}
                className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <Link
                  href="/register"
                  className={cn(buttonVariants({ size: "lg" }), "sm:w-auto")}
                >
                  Daftar gratis
                  <ArrowRight aria-hidden="true" />
                </Link>
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "lg" }),
                    "sm:w-auto",
                  )}
                >
                  Saya sudah punya akun
                </Link>
              </Reveal>
            </div>

            <Reveal delayIndex={6}>
              <LiveBoard />
            </Reveal>
          </div>
        </section>

        {/* The three steps */}
        <section aria-labelledby="langkah" className={cn(CONTAINER, SECTION_Y)}>
          <div className="flex items-center justify-between mb-12">
            <h2 id="langkah" className="font-heading text-3xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-4xl">
              Langkah donasi
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <LoopReveal
                key={step.title}
                index={i}
                className="card-hover h-full rounded-xl border border-border bg-card p-6 sm:p-8"
              >
                <div>
                  <div className="mb-6 flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <step.icon className="size-5" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {step.text}
                  </p>
                </div>
              </LoopReveal>
            ))}
          </div>
        </section>

        {/* SDG goals */}
        <section className="bg-secondary">
          <div className={cn(CONTAINER, SECTION_Y)}>
            <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-24">
              <div>
                <h2 className="font-heading text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl">
                  Dua tujuan, satu piring.
                </h2>
                <p className="mt-4 max-w-[46ch] text-lg leading-relaxed text-foreground/70">
                  Makanan layak yang terbuang adalah dua masalah sekaligus.
                  SisaBaik dibuat untuk menjawab keduanya.
                </p>
              </div>
              <dl className="space-y-6">
                {GOALS.map((goal, i) => (
                  <LoopReveal key={goal.label} index={i + 10} className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <goal.icon className="size-5" aria-hidden="true" />
                    </div>
                    <div>
                      <dt className="text-sm font-bold">{goal.label}</dt>
                      <dd className="text-sm text-foreground/80">
                        {goal.text}
                      </dd>
                    </div>
                  </LoopReveal>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* Marquee: full-bleed band. bg-primary so the primary-foreground text is readable. */}
        <section
          aria-label="Slogan"
          className="overflow-hidden bg-primary py-6"
        >
          <div className="marquee relative overflow-hidden">
            <div className="marquee-track">
              {[...SLOGANS, ...SLOGANS].map((text, i) => (
                <span
                  key={i}
                  aria-hidden={i >= SLOGANS.length ? true : undefined}
                  className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl"
                >
                  {text}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Closing call to action, inside the container so it keeps its side padding */}
        <section className={cn(CONTAINER, SECTION_Y)}>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <Link
              href="/register"
              className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
            >
              Daftar gratis
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "ghost", size: "lg" }),
                "w-full sm:w-auto",
              )}
            >
              Saya sudah punya akun
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-background/50">
        <div className={cn(CONTAINER, "py-12")}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <p className="font-heading text-2xl font-extrabold leading-none tracking-tight sm:text-3xl">
              SisaBaik
            </p>
            <p className="text-sm text-muted-foreground">
              Platform redistribusi makanan berlebih untuk Indonesia. &copy;
              2026 SisaBaik.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}