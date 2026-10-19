import { Skeleton } from "@/components/ui/skeleton";

interface PageLoaderProps {
  /** Shape of the page being loaded, so the skeleton matches what replaces it. */
  variant?: "dashboard" | "list" | "detail" | "form";
  label?: string;
}

/** A skeleton in the shape of the page, instead of a lone spinner. Announced once to screen readers. */
export function PageLoader({ variant = "list", label = "Memuat halaman" }: PageLoaderProps) {
  return (
    <div role="status" aria-live="polite" className="space-y-8">
      <span className="sr-only">{label}</span>

      <div className="space-y-3" aria-hidden="true">
        <Skeleton className="h-10 w-64 max-w-full rounded-xl" />
        <Skeleton className="h-5 w-96 max-w-full rounded-lg" />
      </div>

      {variant === "dashboard" && (
        <div aria-hidden="true" className="space-y-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {variant === "list" && (
        <div aria-hidden="true" className="space-y-6">
          <Skeleton className="h-11 w-full rounded-xl" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-24 rounded-full" />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-60 rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {variant === "detail" && (
        <div aria-hidden="true" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      )}

      {variant === "form" && (
        <div aria-hidden="true" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Skeleton className="h-[34rem] rounded-xl" />
          <Skeleton className="hidden h-72 rounded-xl lg:block" />
        </div>
      )}
    </div>
  );
}
