import type { Metadata } from "next";
import { NotifikasiInbox } from "../../_components/notifikasi-inbox";

// Notification inbox. The whole body is membership-gated, so it is a client
// island; the page itself is static chrome and needs no Suspense boundary.
//
// No <main> here any more: app/(akun)/layout.tsx wraps this in <AccountShell/>,
// which owns the one <main>, the gutter and the safe-area padding. Two <main>s
// is invalid HTML and gives a screen reader two "main" landmarks to choose
// between. The reading width and the `@container` stay on the page, where the
// widths differ per surface.
export const metadata: Metadata = {
  title: "Notifikasi",
  description: "Balasan diskusi, hasil kurasi sumber, dan status usulanmu.",
  robots: { index: false },
};

export default function NotifikasiPage() {
  return (
    <div className="@container mx-auto w-full max-w-2xl">
      <header className="mb-8 space-y-2">
        <span className="eyebrow">Notifikasi</span>
        <h1 className="font-display text-lg @sm:text-xl">
          Kabar <em className="italic text-primary">terbaru untukmu</em>.
        </h1>
        <p className="max-w-xl text-pretty text-muted-foreground">
          Balasan diskusi, hasil kurasi sumber, dan status usulanmu — semua di satu kotak.
        </p>
      </header>
      <NotifikasiInbox />
    </div>
  );
}
