"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      className={cn("flex items-center justify-center gap-1", className)}
      aria-label="Paginasi"
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Halaman sebelumnya"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        <span className="sr-only">Sebelumnya</span>
      </Button>

      <span className="px-3 text-sm text-muted-foreground">
        Halaman {page} dari {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Halaman berikutnya"
      >
        <span className="sr-only">Berikutnya</span>
        <ChevronRight className="size-4" aria-hidden="true" />
      </Button>
    </nav>
  );
}
