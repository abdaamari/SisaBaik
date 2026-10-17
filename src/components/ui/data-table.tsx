import { cn } from '@/lib/utils';

interface DataTableProps<T> {
  columns: Array<{
    accessor: keyof T;
    header: string;
    className?: string;
  }>;
  data: T[];
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  className,
  emptyMessage = "Tidak ada data",
  loading = false
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className={cn("min-h-[200px]", className)}>
        <div className="flex items-center justify-center py-8">
          <div className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-muted-foreground/20" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted-foreground/20" />
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn("min-h-[200px]", className)}>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="h-8 w-8 mx-auto text-muted-foreground/50">
            {/* Empty state icon would go here */}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/40">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.accessor)}
                  className={cn(
                    "text-left text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground px-4 py-3.5",
                    column.className
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {data.map((row, index) => (
              <tr key={index} className="transition-colors hover:bg-muted/40">
                {columns.map((column) => (
                  <td
                    key={`${index}-${String(column.accessor)}`}
                    className={cn(
                      "whitespace-nowrap px-4 py-3.5 text-sm leading-6 text-foreground",
                      column.className
                    )}
                  >
                    {String(row[column.accessor])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
