import { BlurImage } from "@/components/blur-image";
import type { FoodType } from "@/lib/home-filters";
import { cn } from "@/lib/utils";

/**
 * "What's on your mind?" — round photo tiles, one per food type, in a row
 * that bleeds to the screen edges. Tapping one filters Home to that type;
 * tapping it again clears it. The chosen tile wears a slowly turning
 * sunset ring (still under reduced motion) and its label goes pink.
 */
export function FoodTypeRail({
  types,
  selected,
  onSelect,
}: {
  /** Only the types that have something to order right now. */
  types: FoodType[];
  selected: string | null;
  onSelect: (key: string | null) => void;
}) {
  if (types.length === 0) return null;

  return (
    <section aria-labelledby="food-types-heading" className="mt-7">
      <h2 id="food-types-heading" className="font-heading text-title font-bold">
        What&apos;s on your mind?
      </h2>
      <ul className="-mx-6 mt-3 flex snap-x scroll-px-6 gap-3.5 overflow-x-auto px-6 pt-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {types.map((type, i) => {
          const isSelected = type.key === selected;
          return (
            <li key={type.key} className="shrink-0 snap-start">
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(isSelected ? null : type.key)}
                className="group flex w-[4.75rem] flex-col items-center gap-1.5 rounded-2xl outline-none"
              >
                <span className="relative block size-[4.5rem] rounded-full p-[3px] group-focus-visible:ring-3 group-focus-visible:ring-ring/80">
                  {isSelected && (
                    <span aria-hidden="true" className="food-ring animate-ring-spin absolute inset-0 rounded-full" />
                  )}
                  <span
                    className={cn(
                      "relative block size-full overflow-hidden rounded-full bg-secondary shadow-card ring-2 ring-background",
                      isSelected && "animate-pop-in",
                    )}
                  >
                    <BlurImage
                      src={type.photo}
                      alt=""
                      sizes="72px"
                      loading={i < 5 ? "eager" : undefined}
                      className="object-cover transition-transform duration-(--dur-slow) ease-out-expo group-hover:scale-110"
                    />
                  </span>
                </span>
                <span className={cn("text-xs font-semibold", isSelected ? "text-primary" : "text-foreground")}>
                  {type.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
