"use client";
// Komunitas — the OS "communities" app. Two modes, switched by payload:
//   • payload.tenantSlug given → ONE community: its profile + join CTA + members
//     (reused TenantHomeView) plus its published kelas (a course click opens the
//     Kelas app in its own window) and, for instructor+, a "Kelola" action that
//     opens the Kelola app.
//   • no payload → the directory: "Komunitas saya" for the signed-in user, then
//     the active-community etalase (each with a JoinButton; opening one spawns
//     this same app scoped to that tenant).
// Runs inside an appshell window, so it fetches client-side via useQuery (root
// layout already mounts Convex). Tenant/course rendering is REUSED from the
// tenants + courses slices — nothing about profiles/join/roles is reimplemented.
import { useQuery } from "convex/react";
import { type AppProps } from "@/features/appshell";
import { openApp } from "./_nav";
import {
  JoinButton,
  RoleChip,
  TenantHomeView,
  tenantsApi,
  useMyCommunities,
  useMyMembership,
  useTenantBySlug,
  type MyCommunity,
  type PublicTenant,
} from "@/features/tenants";
import { type CourseCardData } from "@/features/courses";
import { useCurrentProfile } from "@/features/profiles";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Compass, Library, LogIn, Megaphone, Settings2, Users } from "lucide-react";

// ── Shared course tile ───────────────────────────────────────────────────────
// Mirrors Beranda's KelasGrid item: a button (not a route Link) so a course
// opens the Kelas app in its own window instead of navigating the shell.
function CourseTile({ course, tenantSlug }: { course: CourseCardData; tenantSlug: string }) {
  return (
    <button
      type="button"
      onClick={() => openApp("kelas", course.title, [tenantSlug, course.slug])}
      className="group flex min-h-11 flex-col gap-1.5 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="min-w-0 truncate font-serif text-base font-medium text-pretty group-hover:text-primary">
        {course.title}
      </span>
      {course.description ? (
        <span className="line-clamp-2 text-sm text-muted-foreground">{course.description}</span>
      ) : null}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MODE 1 — a single community (payload.tenantSlug)
// ═══════════════════════════════════════════════════════════════════════════

// Slots below TenantHomeView's profile card: an instructor+ "Kelola" action and
// the community's published kelas. Self-fetches the tenant by slug (deduped with
// TenantHomeView's own read) so it can resolve the tenantId for courses/role.
function CommunityBody({ slug }: { slug: string }) {
  const tenant = useTenantBySlug(slug);
  const { membership } = useMyMembership(tenant?._id);
  const courses = useQuery(
    api.features.courses.queries.listPublished,
    tenant ? { tenantId: tenant._id } : "skip"
  ) as CourseCardData[] | undefined;

  const canManage = membership?.role === "owner" || membership?.role === "instructor";

  return (
    <div className="flex flex-col gap-8">
      {/* Community sub-features — each opens its own deep-linkable window. */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          className="min-h-11 sm:min-h-9"
          onClick={() => openApp("resources", tenant?.name ?? "Resources", [slug])}
        >
          <Library aria-hidden className="size-4" />
          Sumber &amp; usulan
        </Button>
        <Button
          variant="outline"
          className="min-h-11 sm:min-h-9"
          onClick={() => openApp("pengumuman", tenant?.name ?? "Pengumuman", [slug])}
        >
          <Megaphone aria-hidden className="size-4" />
          Pengumuman
        </Button>
        {canManage && tenant ? (
          <Button
            variant="outline"
            className="min-h-11 sm:min-h-9"
            onClick={() => openApp("kelola", tenant.name, [slug])}
          >
            <Settings2 aria-hidden className="size-4" />
            Kelola
          </Button>
        ) : null}
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-1 border-b pb-3">
          <span className="eyebrow">Kelas</span>
          <h2 className="font-serif text-2xl">Mulai belajar di sini.</h2>
        </div>
        {tenant === undefined || courses === undefined ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
            Kelas pertama sedang disiapkan 🌱
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <CourseTile key={course._id} course={course} tenantSlug={slug} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CommunityView({ slug }: { slug: string }) {
  return (
    <div className="mx-auto w-full max-w-4xl p-6 sm:p-8">
      <TenantHomeView
        slug={slug}
        loginHref="/masuk"
        className="flex flex-col gap-8"
      >
        <CommunityBody slug={slug} />
      </TenantHomeView>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MODE 2 — the community directory (no payload)
// ═══════════════════════════════════════════════════════════════════════════

// One "Komunitas saya" row: the name opens this app scoped to that tenant; the
// caller's role is shown via the reused RoleChip. Kept as siblings (not a button
// wrapping a chip) to avoid nested interactive elements.
function MyCommunityRow({ community }: { community: MyCommunity }) {
  return (
    <li className="flex items-center justify-between gap-4 rounded-xl border bg-card px-5 py-4 transition-colors hover:border-primary/40 hover:bg-accent/40">
      <button
        type="button"
        onClick={() => openApp("komunitas", community.name, [community.slug])}
        className="flex min-h-11 min-w-0 flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
      >
        <span className="truncate font-serif font-medium">{community.name}</span>
        <span className="truncate text-sm text-muted-foreground">{community.description}</span>
      </button>
      <RoleChip role={community.role} className="shrink-0" />
    </li>
  );
}

function MyCommunitiesSection() {
  const { isAuthenticated, isLoading } = useCurrentProfile();
  const communities = useMyCommunities();

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-1 border-b pb-3">
        <span className="eyebrow">Komunitas saya</span>
        <h2 className="font-serif text-2xl">Yang kamu ikuti.</h2>
      </div>

      {!isAuthenticated && !isLoading ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users aria-hidden />
            </EmptyMedia>
            <EmptyTitle className="font-serif">Masuk untuk melihat komunitasmu</EmptyTitle>
            <EmptyDescription className="text-pretty">
              Setelah masuk, komunitas yang kamu ikuti tampil di sini.
            </EmptyDescription>
          </EmptyHeader>
          <Button className="min-h-11" onClick={() => openApp("masuk", "Masuk")}>
            <LogIn aria-hidden className="size-4" />
            Masuk
          </Button>
        </Empty>
      ) : communities === undefined ? (
        <div className="grid gap-3">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : communities.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle className="font-serif">Belum ikut komunitas apa pun 🌱</EmptyTitle>
            <EmptyDescription className="text-pretty">
              Jelajahi komunitas aktif di bawah, lalu gabung yang paling kamu suka.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="grid gap-3">
          {communities.map((c) => (
            <MyCommunityRow key={c._id} community={c} />
          ))}
        </ul>
      )}
    </section>
  );
}

// One etalase row: the name opens this app scoped to that tenant; the reused
// JoinButton renders the correct join affordance (login / join / role) beside it.
function DirectoryRow({ tenant }: { tenant: PublicTenant }) {
  return (
    <li className="flex items-center justify-between gap-4 rounded-xl border bg-card px-5 py-4 transition-colors hover:border-primary/40 hover:bg-accent/40">
      <button
        type="button"
        onClick={() => openApp("komunitas", tenant.name, [tenant.slug])}
        className="flex min-h-11 min-w-0 flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
      >
        <span className="truncate font-serif font-medium">{tenant.name}</span>
        <span className="truncate text-sm text-muted-foreground">{tenant.description}</span>
      </button>
      <JoinButton
        tenantId={tenant._id}
        loginHref="/masuk"
        className="shrink-0"
      />
    </li>
  );
}

function ExploreSection() {
  const tenants = useQuery(tenantsApi.listActive, { limit: 12 }) as PublicTenant[] | undefined;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-1 border-b pb-3">
        <span className="eyebrow">Jelajahi</span>
        <h2 className="font-serif text-2xl">Komunitas aktif.</h2>
      </div>

      {tenants === undefined ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : tenants.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Compass aria-hidden />
            </EmptyMedia>
            <EmptyTitle className="font-serif">Belum ada komunitas aktif</EmptyTitle>
            <EmptyDescription className="text-pretty">
              Komunitas pertama sedang dikurasi. Cek lagi sebentar lagi 🌱
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="grid gap-3">
          {tenants.map((tenant) => (
            <DirectoryRow key={tenant._id} tenant={tenant} />
          ))}
        </ul>
      )}
    </section>
  );
}

function CommunityDirectory() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-10 p-6 sm:p-8">
      <header className="space-y-2">
        <span className="eyebrow">Komunitas belajar AI · Bahasa Indonesia</span>
        <h1 className="text-3xl sm:text-4xl">
          Temukan <em className="italic text-primary">komunitasmu</em>.
        </h1>
        <p className="max-w-xl text-pretty text-muted-foreground">
          Gabung komunitas belajar, buka kelasnya, dan catat progresmu — gratis, berbahasa
          Indonesia.
        </p>
      </header>

      <MyCommunitiesSection />
      <ExploreSection />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════

export default function KomunitasApp(props: AppProps) {
  const payload = props.payload as { tenantSlug?: string } | undefined;

  return payload?.tenantSlug ? (
    <CommunityView slug={payload.tenantSlug} />
  ) : (
    <CommunityDirectory />
  );
}
