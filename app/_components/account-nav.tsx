"use client";

// THE ACCOUNT RAIL — the same dashboard sidebar as /k/<slug>, at the one scope
// that has no community behind it.
//
// WHY IT IS NOT <ShellNav/>. That component's whole top block is a community:
// it takes `slug`, `name`, `tenantId` and a `TenantTabSignal`, and its rows are
// `visibleCommunityTabs(signal)`. /pengaturan has none of those. The honest
// alternatives were both worse:
//   · Mount ShellNav with DEFAULT_COMMUNITY_SLUG. It would put "Materi ·
//     Skills · Kelas …" of the FLAGSHIP community around a member of some
//     other one, and hardcode single-tenancy into a backend that is multi-
//     tenant by design. A nav that points somewhere you are not is worse than
//     no nav.
//   · Copy ShellAccountNav's rows. That is the fork the brief forbids, and the
//     two lists would drift.
// So this is a COMPOSITION, not a fork: every row below is the sibling's own
// <ShellAccountNav/>, every row primitive is theirs, and the only thing this
// file adds is the header block and the one row the tab SSOT never owned.
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  NavLink,
  NavSection,
  ShellAccountNav,
  isPathActive,
  KOMUNITAS_LINK,
} from "@/components/shell";
import { cn } from "@/lib/utils";

export function AccountNav({
  onNavigate,
  className,
}: {
  /** Closes the phone slide-over. Client→client, never a server prop. */
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      {/* Where you are: the site, not a community. The /k rail spends this
          block on the community identity plus a way out of it; here the brand
          IS the way back in — "/" redirects to the flagship. One control, not a
          back-chevron AND a wordmark that mean the same thing. */}
      <div className="shrink-0 border-b-2 px-4 pb-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="pixel-press -ml-1 inline-flex min-h-11 items-center px-1 font-display text-marquee uppercase hover:text-primary"
        >
          Belajar
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-2 pb-[calc(var(--safe-b)+1rem)]">
        <NavSection label="Jelajah">
          <li>
            {/* Same href as the rail's "Komunitas lain", different label: from
                outside a community there is no "other" to be lain than. */}
            <NavLink
              href={KOMUNITAS_LINK.href}
              label="Komunitas"
              icon={KOMUNITAS_LINK.icon}
              active={isPathActive(KOMUNITAS_LINK.href, pathname, KOMUNITAS_LINK.exact)}
              onNavigate={onNavigate}
            />
          </li>
        </NavSection>
        <ShellAccountNav onNavigate={onNavigate} />
      </div>
    </div>
  );
}
