import { cn } from "@/lib/utils";
import React from "react";

interface NavigationMenuItemProps {
  href: string;
  label: string;
}

export function NavigationMenuItem({ href, label }: NavigationMenuItemProps) {
  const [active, setActive] = React.useState(false);

  return (
    <button
      type="button"
      title={href}
      className={cn(
        "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-primary hover:bg-primary/5",
        "data-[state=active]:bg-primary/10 data-[state=active]:text-primary",
      )}
      onClick={() => setActive(true)}
    >
      {/* Icon would be rendered here based on label */}
      {label}
    </button>
  );
}
