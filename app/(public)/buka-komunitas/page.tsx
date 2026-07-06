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
      <div className="mb-8 space-y-4">
        <h1 className="text-2xl font-semibold">Buka komunitas belajar</h1>
        <p className="text-muted-foreground">
          Punya topik AI yang mau kamu ajarkan? Ajukan komunitasmu — prosesnya ringan.
        </p>
        <ol className="grid gap-2 sm:grid-cols-3">
          {ALUR.map((step, i) => (
            <li
              key={step}
              className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground"
            >
              <span className="font-medium text-foreground">{i + 1}.</span> {step}
            </li>
          ))}
        </ol>
      </div>
      <RequestTenantForm onSuccess={() => router.push("/")} />
    </div>
  );
}
