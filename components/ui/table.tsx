import * as React from "react";
import { cn } from "@/lib/utils";

/** Scrolls horizontally inside its card on narrow screens instead of squashing columns or widening the page. */
export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className={cn("w-full min-w-[560px] text-sm", className)} {...props} />
    </div>
  );
}

export function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("border-b px-3 py-2 text-left text-xs font-semibold uppercase text-muted-foreground", className)} {...props} />;
}

export function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("border-b px-3 py-3 align-top", className)} {...props} />;
}
