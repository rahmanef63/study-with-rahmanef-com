"use client";

// Pick one of the bundled avatars, or keep your own URL.
//
// WHY IT EXISTS. `profiles.avatarUrl` has always been a free-text field, and
// the product ships six avatars nobody could reach: a member had to know the
// path and type it. Six files sitting in public/ that only their author can
// find is the same as not shipping them.
//
// A RADIOGROUP, not six buttons. Exactly one avatar is in effect at a time and
// choosing does not submit — the form's Save does. Buttons would announce as
// six unrelated actions and leave a screen-reader user with no sense of which
// is current or how many there are; a radiogroup says "2 of 7" and arrow-keys
// between them, which is what this control actually is.
//
// "Tanpa foto" is the seventh option rather than a Clear button, for the same
// reason: no-avatar is a CHOICE among the others (initials, which are personal
// and need no download), not an escape from having made one.
import { Check } from "lucide-react";
import { BUNDLED_AVATARS } from "@/lib/avatars";
import { cn } from "@/lib/utils";
import { ProfileAvatar } from "./profile-avatar";

export type AvatarPickerProps = {
  /** Current `avatarUrl` — "" means none. */
  value: string;
  onChange: (value: string) => void;
  /** For the initials shown by the "Tanpa foto" option. */
  name: string;
  className?: string;
};

const CELL =
  "relative grid size-16 place-items-center border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function AvatarPicker({ value, onChange, name, className }: AvatarPickerProps) {
  const options = [{ path: "", label: "Tanpa foto — pakai inisial" }, ...BUNDLED_AVATARS];
  // A custom URL the member typed is a legitimate state with no cell of its
  // own; nothing is checked, and the field below still holds their value.
  const activeIndex = options.findIndex((o) => o.path === value);

  return (
    <div
      role="radiogroup"
      aria-label="Pilih avatar"
      className={cn("flex flex-wrap gap-2", className)}
    >
      {options.map((option, i) => {
        const selected = option.path === value;
        return (
          <button
            key={option.path || "none"}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            // Roving tabindex: the group is ONE tab stop, and the arrow keys
            // move inside it. Seven tab stops for one question is how a
            // keyboard user ends up skipping the rest of the form.
            tabIndex={selected || (activeIndex === -1 && i === 0) ? 0 : -1}
            onClick={() => onChange(option.path)}
            onKeyDown={(e) => {
              const next =
                e.key === "ArrowRight" || e.key === "ArrowDown"
                  ? 1
                  : e.key === "ArrowLeft" || e.key === "ArrowUp"
                    ? -1
                    : 0;
              if (next === 0) return;
              e.preventDefault();
              const from = activeIndex === -1 ? 0 : activeIndex;
              const target = (from + next + options.length) % options.length;
              onChange(options[target]!.path);
              const group = e.currentTarget.parentElement;
              group?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[target]?.focus();
            }}
            className={cn(
              CELL,
              selected
                ? "border-primary shadow-sm"
                : "border-border hover:border-primary"
            )}
          >
            {option.path === "" ? (
              <ProfileAvatar name={name} size={56} />
            ) : (
              // A plain <img>: these are fixed 56px thumbnails of files we
              // already ship at 5–19 KB, so next/image would add a runtime
              // optimiser pass for nothing.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={option.path} alt="" width={56} height={56} loading="lazy" decoding="async" />
            )}
            {selected ? (
              <span
                aria-hidden
                className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center border border-primary bg-primary text-primary-foreground"
              >
                <Check className="size-3" />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
