import { cn } from "@/lib/utils";

/** The standard Indian veg (green) / non-veg (red) square-and-dot mark. */
export function VegMark({ isVeg, className }: { isVeg: boolean; className?: string }) {
  return (
    <span
      role="img"
      aria-label={isVeg ? "Veg" : "Non-veg"}
      className={cn(
        "inline-flex size-[1.1rem] shrink-0 items-center justify-center rounded-[4px] border-[1.5px]",
        isVeg ? "border-success" : "border-destructive",
        className,
      )}
    >
      <span className={cn("size-2 rounded-full", isVeg ? "bg-success" : "bg-destructive")} />
    </span>
  );
}
