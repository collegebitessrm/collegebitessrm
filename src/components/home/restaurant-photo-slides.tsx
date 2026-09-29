"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { BlurImage } from "@/components/blur-image";
import { VegMark } from "@/components/veg-mark";
import type { CardSlide } from "@/lib/data/dish-photos";
import { formatRupees } from "@/lib/format";
import { cn } from "@/lib/utils";

/** How long the first slide (the cover) holds, on screen, before sliding starts. */
const FIRST_SLIDE_MS = 2500;
/** How long each later slide holds. */
const SLIDE_MS = 3200;
const TICK_MS = 250;
/** How long autoplay backs off after the student touches the slides. */
const PAUSE_AFTER_TOUCH_MS = 8000;

/**
 * The photo strip on Home's restaurant card: cover first, then dishes
 * with a "name · price" chip, advancing on its own every few seconds and
 * swipeable by hand (native scroll-snap, so a swipe never counts as a tap
 * on the card's link). Tapping a dish slide opens the menu at that dish
 * (`?dish=`, same deep link as search results); tapping the cover opens
 * the menu as usual.
 *
 * Each slide's hold time only counts while the card is mostly on screen,
 * the tab is visible and no touch is backing it off — so the cover always
 * gets its full FIRST_SLIDE_MS once seen. Never autoplays under reduced motion
 * (swiping still works). Photos mount one slide ahead of the current one,
 * and only once the card has been seen — a card below the fold still
 * downloads just its cover.
 */
export function RestaurantPhotoSlides({
  slides,
  restaurantHref,
  autoplay,
  startDelay = 0,
  children,
}: {
  slides: CardSlide[];
  /** The card's own link — a dish slide appends ?dish= to it. */
  restaurantHref: string;
  autoplay: boolean;
  /** Extra hold on the cover, so a list of cards doesn't flip in lockstep. */
  startDelay?: number;
  /** Overlays that stay put while the photos move (the Open/Closed chip). */
  children?: ReactNode;
}) {
  const router = useRouter();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  // Highest slide whose photo is mounted.
  const [reach, setReach] = useState(0);
  const indexRef = useRef(0);
  const visibleRef = useRef(false);
  const pausedUntilRef = useRef(0);
  const count = slides.length;

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) setReach((r) => Math.max(r, indexRef.current + 1));
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!autoplay || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // When the current slide started counting toward its hold time.
    let shownAt = Date.now();
    let shownIndex = indexRef.current;
    const interval = setInterval(() => {
      const el = scrollerRef.current;
      const now = Date.now();
      if (!el || !visibleRef.current || document.hidden || now < pausedUntilRef.current) {
        shownAt = now;
        return;
      }
      if (indexRef.current !== shownIndex) {
        shownIndex = indexRef.current;
        shownAt = now;
        return;
      }
      const hold = shownIndex === 0 ? FIRST_SLIDE_MS + startDelay : SLIDE_MS;
      if (now - shownAt < hold) return;
      const next = (shownIndex + 1) % count;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
      shownAt = now;
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [autoplay, count, startDelay]);

  function onClick(e: MouseEvent) {
    const dish = slides[indexRef.current]?.dish;
    // Modified clicks (new tab etc.) keep the card's plain link.
    if (!dish || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    router.push(`${restaurantHref}?dish=${dish.id}`, { transitionTypes: ["nav-forward"] });
  }

  function onScroll() {
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i === indexRef.current) return;
    indexRef.current = i;
    setIndex(i);
    setReach((r) => Math.max(r, i + 1));
  }

  return (
    <div className="relative h-full">
      {/* Decorative — the card's link text already names the restaurant. */}
      <div
        ref={scrollerRef}
        aria-hidden="true"
        tabIndex={-1}
        onScroll={onScroll}
        onClick={onClick}
        onPointerDown={() => {
          pausedUntilRef.current = Date.now() + PAUSE_AFTER_TOUCH_MS;
        }}
        className="flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {count === 0 && <div className="h-full w-full shrink-0 bg-stripes" />}
        {slides.map((slide, i) => (
          <div key={slide.src} className="relative h-full w-full shrink-0 snap-start snap-always bg-secondary">
            {(i === 0 || i <= reach) && (
              <BlurImage
                src={slide.src}
                alt=""
                sizes="(min-width: 448px) 400px, 90vw"
                loading={i === 0 ? undefined : "eager"}
                className="object-cover"
              />
            )}
            {slide.dish && (
              <span className="absolute bottom-2.5 left-2.5 flex max-w-[calc(100%-1.25rem)] items-center gap-1.5 rounded-full bg-card/90 py-1 pr-2.5 pl-1.5 text-xs font-semibold backdrop-blur-sm">
                <VegMark isVeg={slide.dish.isVeg} className="size-3.5 bg-card [&>span]:size-1.5" />
                <span className="truncate">{slide.dish.name}</span>
                <span className="shrink-0 tabular-nums">· {formatRupees(slide.dish.price)}</span>
              </span>
            )}
          </div>
        ))}
      </div>

      {children}

      {count > 1 && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-card/90 px-2 py-1.5 backdrop-blur-sm"
        >
          {slides.map((slide, i) => (
            <span
              key={slide.src}
              className={cn(
                "h-1.5 rounded-full duration-(--dur-base) ease-out-expo motion-safe:transition-[width,background-color]",
                i === index ? "w-3.5 bg-foreground" : "w-1.5 bg-muted-foreground/50",
              )}
            />
          ))}
        </span>
      )}
    </div>
  );
}
