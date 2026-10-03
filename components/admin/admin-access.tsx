"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { useCurrentProfile } from "@/features/profiles";
import { Skeleton } from "@/components/ui/skeleton";

const subscribe = () => () => {};
/** UX only: child queries mount after the profile establishes permission. */
export function AdminAccess({ children }: { children: React.ReactNode }) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const { profile, isLoading, isAuthenticated } = useCurrentProfile();
  const pathname = usePathname();
  if (!mounted || isLoading) return <div role="status" className="space-y-4 py-8"><p>Memeriksa akses admin…</p><Skeleton className="h-11 w-full" /><Skeleton className="h-48 w-full" /></div>;
  if (!isAuthenticated) return <section className="space-y-3 py-8"><h1 className="text-2xl font-semibold">Masuk sebagai admin</h1><p className="text-muted-foreground">Halaman ini memerlukan akun admin platform.</p><Link className="inline-flex min-h-11 items-center text-primary underline" href={`/masuk?next=${encodeURIComponent(pathname)}`}>Masuk</Link></section>;
  if (profile?.isPlatformAdmin !== true) return <section className="space-y-3 py-8"><h1 className="text-2xl font-semibold">Akses admin diperlukan</h1><p className="text-muted-foreground">Akun ini belum memiliki izin admin platform. Pengelola komunitas dapat menggunakan menu Kelola.</p><Link className="inline-flex min-h-11 items-center text-primary underline" href="/home">Kembali ke beranda</Link></section>;
  return children;
}
