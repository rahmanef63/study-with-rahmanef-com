// Below md the rail cannot be persistent — 240px of a 390px screen is not a
// sidebar, it is the page. What stays on screen is a 52px bar: where you are,
// and one action.
//
// THE MENU TRIGGER IS NOT HERE. It moved to <ShellDock/> on the bottom edge
// when the dock came back, because a hamburger in the top-left corner is the
// furthest point from a thumb on a phone. One trigger, one panel, one place to
// look — a second trigger up here would only be a second thing to keep in
// sync. The Sheet, its focus trap and the close-above-md guard all live with
// the trigger.
//
import { ShellAction } from "./shell-action";
import type { ShellCommunity } from "./shell-nav";

/** Content height, before --safe-t. 52 + the 2px rule = 54px: inside the 56px
 *  iOS cap, with 4px of air around a 44px control instead of squeezing it. */
const BAR_H = "3.25rem";

export function ShellTopBar({ community, title }: { community?: ShellCommunity; title?: string }) {
  return (
    <header
      // z-30: above content, under the sheet (50) and the CRT overlay (9999).
      // Opaque bg-card and a hard 2px rule — no blur, no floating pill.
      className="sticky top-0 z-30 border-b bg-card pt-[var(--safe-t)] md:hidden"
    >
      <div
        className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4"
        style={{ minHeight: BAR_H }}
      >
        {/* Body face, not Press Start 2P: the display face is DISPLAY-ONLY and
            at bar size it is unreadable and ~2x as wide. aria-hidden because
            the content column's own heading already gives a screen reader the
            same string. */}
        <span aria-hidden className="min-w-0 flex-1 truncate text-sm font-medium">
          {community?.name ?? title ?? "Belajar"}
        </span>
        {community === undefined ? null : (
          <ShellAction tenantId={community.tenantId} slug={community.slug} variant="bar" />
        )}
      </div>
    </header>
  );
}

/** Same geometry as the real bar, so the suspended shell never jumps. */
export function ShellTopBarSkeleton() {
  return (
    <div
      aria-hidden
      className="sticky top-0 z-30 border-b bg-card pt-[var(--safe-t)] md:hidden"
      style={{ minHeight: BAR_H }}
    />
  );
}
