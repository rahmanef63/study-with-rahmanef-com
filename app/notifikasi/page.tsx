import type { Metadata } from "next";
import { NotifikasiInbox } from "../_components/notifikasi-inbox";

// Notification inbox. The whole body is membership-gated, so it is a client
// island; the page itself is static chrome and needs no Suspense boundary.
export const metadata: Metadata = {
  title: "Notifikasi",
  description: "Balasan diskusi, hasil kurasi sumber, dan status usulanmu.",
  robots: { index: false },
};

export default function NotifikasiPage() {
  return (
    <main className="@container mx-auto w-full max-w-2xl px-6 py-12">
      <header className="mb-8 space-y-2">
        <span className="eyebrow">Notifikasi</span>
        <h1 className="font-serif text-3xl @sm:text-4xl">
          Kabar <em className="italic text-primary">terbaru untukmu</em>.
        </h1>
        <p className="max-w-xl text-pretty text-muted-foreground">
          Balasan diskusi, hasil kurasi sumber, dan status usulanmu — semua di satu kotak.
        </p>
      </header>
      <NotifikasiInbox />
    </main>
  );
}
