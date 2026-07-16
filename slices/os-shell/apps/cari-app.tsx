"use client";
// Cari — per-community search app (#27, mounts STATUS #23). Deep-link:
// /cari/<tenantSlug>. Wraps the search slice's SearchView with the os-shell
// integration seams: tenant resolution by slug (same public query komunitas/
// resources use) and onNavigate → openHref so a result click opens the Kelas
// window instead of navigating the shell.
//
// searchInTenant is MEMBER-ONLY server-side (anon/outsider throw), so this app
// login-gates up front — same pattern as kelola-app — instead of letting the
// first keystroke throw into the window. The server re-checks regardless.
import { type AppProps } from "@/features/appshell";
import { SearchView } from "@/features/search";
import { useMyMembership, useTenantBySlug } from "@/features/tenants";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Hero } from "@/components/mockup-kit";
import { LogIn, SearchX, UserPlus } from "lucide-react";
import { openApp, openHref, seg } from "./_nav";

function CariEmpty({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: typeof SearchX;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon aria-hidden />
        </EmptyMedia>
        <EmptyTitle className="font-serif">{title}</EmptyTitle>
        <EmptyDescription className="text-pretty">{body}</EmptyDescription>
      </EmptyHeader>
      {action}
    </Empty>
  );
}

export default function CariApp(props: AppProps) {
  const [slug] = seg(props.payload);
  // Hook signature takes a plain string; the !slug branch below never reads
  // `tenant`, and getPublicBySlug("") harmlessly resolves null (public query).
  const tenant = useTenantBySlug(slug ?? "");
  const { membership, isAuthenticated, isAuthLoading } = useMyMembership(tenant?._id);

  let body: React.ReactNode;
  if (!slug) {
    body = (
      <CariEmpty
        icon={SearchX}
        title="Komunitas belum dipilih"
        body="Buka pencarian dari sebuah komunitas untuk menelusuri kelas dan materinya."
      />
    );
  } else if (!isAuthLoading && !isAuthenticated) {
    body = (
      <CariEmpty
        icon={LogIn}
        title="Masuk untuk mencari"
        body="Pencarian kelas dan materi hanya untuk anggota komunitas. Masuk dulu, ya."
        action={
          <Button className="min-h-11" onClick={() => openApp("masuk", "Masuk")}>
            <LogIn aria-hidden className="size-4" /> Masuk
          </Button>
        }
      />
    );
  } else if (tenant === undefined || isAuthLoading || membership === undefined) {
    body = (
      <div className="space-y-3" aria-busy>
        <span className="sr-only">Memuat pencarian…</span>
        <Skeleton className="h-11 w-full rounded-md" />
        <Skeleton className="h-14 w-full rounded-md" />
        <Skeleton className="h-14 w-full rounded-md" />
      </div>
    );
  } else if (tenant === null) {
    body = (
      <CariEmpty
        icon={SearchX}
        title="Komunitas tidak ditemukan"
        body="Komunitas ini tidak aktif atau tautannya sudah tidak berlaku."
      />
    );
  } else if (membership === null) {
    body = (
      <CariEmpty
        icon={UserPlus}
        title="Gabung dulu untuk mencari"
        body="Pencarian hanya untuk anggota. Buka komunitasnya lalu tekan Gabung."
        action={
          <Button
            variant="outline"
            className="min-h-11"
            onClick={() => openApp("komunitas", tenant.name, [tenant.slug])}
          >
            Buka komunitas
          </Button>
        }
      />
    );
  } else {
    body = (
      <SearchView tenantId={tenant._id} tenantSlug={tenant.slug} onNavigate={openHref} />
    );
  }

  return (
    <div className="w-full space-y-8 p-6 @sm:p-8">
      <Hero
        eyebrow="Pencarian · Komunitas"
        title={
          <>
            Cari <em className="italic text-primary">kelas & materi</em>.
          </>
        }
        description="Telusuri judul kelas dan isi materi di komunitas ini — hasil terbit saja."
      />
      {body}
    </div>
  );
}
