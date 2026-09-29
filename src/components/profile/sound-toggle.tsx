"use client";

import { Volume2, VolumeX } from "lucide-react";
import { setSoundEnabled, useSoundEnabled } from "@/lib/sound/store";
import { cn } from "@/lib/utils";

/** On/off switch for the subtle order-placed chime. */
export function SoundToggle() {
  const enabled = useSoundEnabled();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label="Order placed sound"
      onClick={() => setSoundEnabled(!enabled)}
      className={cn(
        "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/80",
        enabled ? "bg-primary" : "bg-secondary",
      )}
    >
      <span
        className={cn(
          "flex size-6 items-center justify-center rounded-full bg-white text-ink shadow transition-transform",
          enabled ? "translate-x-7" : "translate-x-1",
        )}
      >
        {enabled ? (
          <Volume2 className="size-3.5" aria-hidden="true" />
        ) : (
          <VolumeX className="size-3.5" aria-hidden="true" />
        )}
      </span>
    </button>
  );
}
