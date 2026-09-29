"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { setTheme, useThemePreference, type ThemePreference } from "@/lib/theme/store";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

/** Compact icon-only version, for tight header spaces. */
export function ThemeIconToggle() {
  const active = useThemePreference();

  return (
    <div role="radiogroup" aria-label="Appearance" className="inline-flex items-center gap-1 rounded-full bg-secondary p-1">
      {OPTIONS.map(({ value, label, Icon }) => {
        const selected = active === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            onClick={() => setTheme(value)}
            className={cn(
              "flex size-8 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/80",
              selected
                ? "bg-ink text-ink-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
