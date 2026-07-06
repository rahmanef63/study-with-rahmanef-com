"use client";

import { useRouter } from "next/navigation";
import { RequestTenantForm } from "@/features/tenants";

// #6 mount — pengajuan komunitas (authenticated; form handles the login gate).
export default function BukaKomunitasPage() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <RequestTenantForm onSuccess={() => router.push("/")} />
    </div>
  );
}
