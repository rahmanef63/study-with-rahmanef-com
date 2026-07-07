"use client";

import { useRouter } from "next/navigation";
import { RequestTenantForm } from "@/features/tenants";

// #6 mount — pengajuan komunitas (authenticated; form handles the login gate).
const ALUR = [
  "Ajukan lewat form ini",
  "Ditinjau tim",
  "Tayang & mulai mengajar",
];

export default function BukaKomunitasPage() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <div className="mb-8">
        <span className="eyebrow">Buka komunitas</span>
        <h1 className="mt-2 text-3xl sm:text-4xl">
          Buka komunitas <em className="italic text-primary">belajar</em>.
        </h1>
        <p className="mt-3 text-pretty text-muted-foreground">
          Punya topik AI yang mau kamu ajarkan? Ajukan komunitasmu — prosesnya ringan.
        </p>
        <ol className="mt-6 grid gap-2 sm:grid-cols-3">
          {ALUR.map((step, i) => (
            <li
              key={step}
              className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground"
            >
              <span className="font-serif font-semibold text-foreground">{i + 1}.</span> {step}
            </li>
          ))}
        </ol>
      </div>
      <RequestTenantForm onSuccess={() => router.push("/")} />
    </div>
  );
}
