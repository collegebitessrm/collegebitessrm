"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

/**
 * A `fill`-mode next/image with a shimmer-to-sharp blur-up: the same
 * shimmer skeleton used for loading.tsx (see components/ui/skeleton.tsx)
 * shows until the real photo has decoded, then cross-fades in. The parent
 * element supplies `position: relative` + sizing, same as any other
 * `fill` image — this only ever renders in fill mode.
 */
export function BlurImage({
  alt,
  className,
  onLoad,
  ...props
}: Omit<ImageProps, "fill" | "width" | "height">) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && (
        <div className="animate-shimmer absolute inset-0 bg-secondary" aria-hidden="true" />
      )}
      <Image
        {...props}
        alt={alt}
        fill
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
        className={cn(
          "opacity-0 duration-300 ease-out motion-safe:transition-opacity",
          loaded && "opacity-100",
          className,
        )}
      />
    </>
  );
}
