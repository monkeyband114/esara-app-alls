import { cn } from "@/lib/utils";

/** Profile photo when a URL was given at signup, otherwise initials. */
export function Avatar({ name, photo, className }: { name: string; photo?: string; className?: string }) {
  const isUrl = Boolean(photo && /^https?:\/\//i.test(photo));
  const initials = (photo && !isUrl ? photo : name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("")).slice(0, 3).toUpperCase();
  return (
    <div className={cn("grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-primary text-lg font-bold text-primary-foreground", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary user-supplied host, not configured for next/image */}
      {isUrl ? <img src={photo} alt={name} className="h-full w-full object-cover" /> : initials}
    </div>
  );
}
