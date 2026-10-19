import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  /** Hide the wordmark and show only the round mark. */
  markOnly?: boolean;
}

/** A leaf on a plate: "sisa" that is still "baik". Drawn inline so it follows the theme. */
export function Logo({ className, markOnly = false }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 font-heading text-xl font-extrabold tracking-tight text-foreground', className)}>
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden="true" focusable="false">
        <circle cx="16" cy="16" r="16" fill="var(--primary)" />
        <path
          d="M8.5 21.5C8.5 13.5 14.5 8.5 24 8.5C24 17.5 19 23.5 10.5 23.5C9.6 23.5 9 22.8 8.5 21.5Z"
          fill="var(--primary-foreground)"
        />
        <path d="M10.5 22C13 17.5 16.5 14 20.5 11.5" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
      {markOnly ? <span className="sr-only">SisaBaik</span> : <span>SisaBaik</span>}
    </span>
  );
}
