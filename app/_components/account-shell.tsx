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
//   /admin, /offline  platform console and the service-worker fallback. Neither
//                     is a learner surface.
//
// MOVED IN 2026-08-11: /u/<username>. It was on the list above, argued as "a
// public profile, same as the certificate" — and the owner reported the
// consequence: "tidak ada navtoolbar". The argument was wrong. A certificate is
// ONE fact someone opens from WhatsApp and closes; a profile is a person, with
// their badges and their communities, and the natural next move is to look at
// one of them. Bare, the page was a dead end with no way anywhere. It lives in
// this group rather than under its own layout so it shares the single rail
// mount (see app/(akun)/layout.tsx for why that matters).
//
// The test: would a person who has never signed in be confused, or misled,
// by a member's sidebar around this page? If yes, it stays bare. A dead end is
// its own kind of misleading, so "no chrome" is not automatically the safe
// answer — ask where the reader would go next, and whether they can.
// ─────────────────────────────────────────────────────────────────────────────
import { AppShell, ShellDock, ShellNav } from "@/components/shell";
import { AccountTitle } from "./account-title";

export function AccountShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      // THE SAME THREE COMPONENTS the community shell mounts, with no
      // community passed. There used to be an AccountNav, an AccountDock and an
      // AccountTopBar — three near-copies whose only real difference was the
      // header block, and together they made the app look like it had two
      // different sidebars depending on which page you were on.
      rail={<ShellNav className="pt-3" />}
      topBar={<AccountTitle />}
      dock={<ShellDock />}
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
