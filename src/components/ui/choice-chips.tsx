"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  /** Optional number shown after the label, e.g. how many donations match. */
  count?: number;
}

interface ChoiceChipsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: ChoiceOption<T>[];
  /** Spoken name of the group, e.g. "Filter status". */
  label: string;
  className?: string;
}

/** A single-choice group of pills. Arrow keys move the choice, like a native radio group. */
export function ChoiceChips<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: ChoiceChipsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = -1;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % options.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + options.length) % options.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = options.length - 1;
    if (next < 0) return;
    event.preventDefault();
    onChange(options[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div role="radiogroup" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={index === selectedIndex ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-card text-foreground hover:bg-muted",
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={cn("text-xs tabular-nums", selected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
