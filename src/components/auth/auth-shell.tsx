import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const POINTS = [
  { title: "Catat", text: "Penyedia mengisi makanan yang tersisa dan batas layak konsumsinya." },
  { title: "Klaim", text: "Mitra terverifikasi mengambil donasi. Satu donasi, satu mitra." },
  { title: "Salurkan", text: "Setiap tahap tercatat, dari klaim sampai makanan sampai." },
];

interface AuthShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Sits under the form, e.g. "Belum punya akun?". */
  footer?: React.ReactNode;
}

/** Shared frame for login and register: a brand panel on wide screens, just the form on a phone. */
export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <Link
          href="/"
          aria-label="SisaBaik, ke beranda"
          className="w-fit rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-foreground"
        >
          <Logo className="text-primary-foreground" />
        </Link>

        <div>
          <p className="max-w-[16ch] font-heading text-5xl leading-[1.05] font-extrabold tracking-tight xl:text-6xl">
            Jangan buang yang masih baik.
          </p>
          <ol className="mt-12 space-y-6">
            {POINTS.map((point, index) => (
              <li key={point.title} className="flex gap-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground text-sm font-bold text-primary tabular-nums">
                  {index + 1}
                </span>
                <div>
                  <p className="font-bold">{point.title}</p>
                  <p className="mt-0.5 max-w-[38ch] text-sm leading-relaxed text-primary-foreground/90">{point.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <p className="text-sm text-primary-foreground/80">Mendukung SDG 12 dan SDG 2.</p>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="flex h-16 items-center justify-between px-4 sm:px-8 lg:justify-end">
          <Link
            href="/"
            aria-label="SisaBaik, ke beranda"
            className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring lg:hidden"
          >
            <Logo />
          </Link>
          <ThemeToggle />
        </header>

        <main id="konten" className="flex flex-1 items-start justify-center px-4 pt-4 pb-16 sm:px-8 lg:items-center lg:pt-0">
          <div className="w-full max-w-md">
            <h1 className="font-heading text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">{title}</h1>
            {description && <p className="mt-3 text-base leading-relaxed text-muted-foreground">{description}</p>}
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div>}
          </div>
        </main>
      </div>
    </div>
  );
}
