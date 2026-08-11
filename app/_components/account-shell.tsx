// The dashboard frame for the app surfaces that are NOT inside a community.
// A server component with no data of its own — unlike app/k/[slug]/layout.tsx
// there is nothing to await here, so there is no Suspense around the chrome and
// the rail is in the very first byte of HTML.
//
// ─────────────────────────────────────────────────────────────────────────────
// WHERE THE LINE IS, AND WHY IT IS THERE.
//
// SHELLED — everything under app/(akun)/, and the route group IS the line:
//   /notifikasi   your inbox. Signed-in only in practice; noindex.
//   /pengaturan   your account. Signed-in only in practice; noindex.
//   /komunitas    the directory. Indexed and shareable, and shelled ANYWAY —
//                 it is the destination of the rail's own "Komunitas lain" row,
//                 so leaving it bare would mean the one link that exists on
//                 every screen of the app drops you out of the app. A member
//                 must be able to come back without the browser's Back button.
//                 A stranger who lands here from search sees a rail offering
//                 "Komunitas" and "Masuk" — true statements, not a member's
//                 dashboard pretending they have one.
//
// NOT SHELLED, deliberately — do not "finish the job" by adding these:
//   /mulai            the page a stranger meets BEFORE joining. Putting a
//                     member's navigation around the pitch tells someone who
//                     has not joined that they already have.
//   /sertifikat/<id>  a shareable artifact. It is opened from WhatsApp by
//                     someone who has no account and wants to see one thing.
//                     Chrome around it is noise at best and a login wall's
//                     shadow at worst.
//   /masuk            one card, one job. A nav whose every row bounces you back
//                     to this page is not navigation.
//   /                 a redirect() to the flagship community. It renders
//                     nothing; there is nothing to wrap.
//   /u/<username>     a PUBLIC profile, linked from posts and shared outward —
//                     same argument as the certificate. (Also not this agent's
//                     file.)
//   /admin, /offline  platform console and the service-worker fallback. Neither
//                     is a learner surface.
//
// The test: would a person who has never signed in be confused, or misled,
// by a member's sidebar around this page? If yes, it stays bare.
// ─────────────────────────────────────────────────────────────────────────────
import { AppShell } from "@/components/shell";
import { AccountNav } from "./account-nav";
import { AccountDock } from "./account-dock";
import { AccountTopBar } from "./account-top-bar";

export function AccountShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      rail={<AccountNav className="pt-3" />}
      topBar={<AccountTopBar />}
      dock={<AccountDock />}
    >
      {/* No width cap and no second @container here. <main> (AppShell) supplies
          the gutter, the safe-area padding and a max-w-5xl outer cap; each page
          then declares its OWN reading width and its OWN `@container` — a
          settings form wants 672px, a card directory wants 768px, and the
          reused slice views inside them size themselves with container queries
          that must resolve against the box they are actually in, not against
          <main>. Hoisting one width up here is what would put a two-column grid
          inside a one-column box. */}
      {children}
    </AppShell>
  );
}
