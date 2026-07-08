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
import { useState } from "react";
import { useQuery } from "convex/react";
import { type AppProps } from "@/features/appshell";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/features/responsive-dialog";
import { openApp } from "./_nav";
import {
  JoinButton,
  RequestTenantForm,
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
  Badge,
  CommandSearch,
  Hero,
  QuickActionRow,
  SectionHeader,
  ViewToggle,
  type QuickAction,
} from "@/components/mockup-kit";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Compass, Library, LogIn, Megaphone, Plus, Settings2, Users } from "lucide-react";

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

  // Community sub-features — each opens its own deep-linkable window. Rendered as
  // the mockup's quick-action strip (icon tiles) instead of a button row.
  const quickActions: QuickAction[] = [
    {
      id: "resources",
      icon: <Library aria-hidden className="size-5" />,
      label: "Sumber & usulan",
      onClick: () => openApp("resources", tenant?.name ?? "Resources", [slug]),
    },
    {
      id: "pengumuman",
      icon: <Megaphone aria-hidden className="size-5" />,
      label: "Pengumuman",
      onClick: () => openApp("pengumuman", tenant?.name ?? "Pengumuman", [slug]),
    },
  ];
  if (canManage && tenant) {
    quickActions.push({
      id: "kelola",
      icon: <Settings2 aria-hidden className="size-5" />,
      label: "Kelola",
      onClick: () => openApp("kelola", tenant.name, [slug]),
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <QuickActionRow items={quickActions} />

      <section className="space-y-4">
        <SectionHeader
          eyebrow="Kelas"
          title="Mulai belajar di sini."
          actions={
            courses && courses.length > 0 ? (
              <Badge tone="muted">{courses.length} kelas</Badge>
            ) : undefined
          }
        />
        {tenant === undefined || courses === undefined ? (
          <div className="grid gap-3 @sm:grid-cols-2 @xl:grid-cols-3 @4xl:grid-cols-4">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
            Kelas pertama sedang disiapkan 🌱
          </p>
        ) : (
          <div className="grid gap-3 @sm:grid-cols-2 @xl:grid-cols-3 @4xl:grid-cols-4">
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
  // Feed the viewer's own id so an owner gets role controls in the roster (and
  // their own row stays read-only). tenants slice stays decoupled from profiles —
  // the id is supplied here at the integration layer, not fetched inside it.
  const { profile } = useCurrentProfile();
  return (
    <div className="w-full p-6 @md:p-8">
      <TenantHomeView
        slug={slug}
        loginHref="/masuk"
        currentUserId={profile?.userId}
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
      <SectionHeader
        eyebrow="Komunitas saya"
        title="Yang kamu ikuti."
        actions={
          communities && communities.length > 0 ? (
            <Badge tone="accent">{communities.length} komunitas</Badge>
          ) : undefined
        }
      />

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
        <ul className="grid gap-3 @3xl:grid-cols-2">
          {communities.map((c) => (
            <MyCommunityRow key={c._id} community={c} />
          ))}
        </ul>
      )}
    </section>
  );
}

// One etalase item: the name opens this app scoped to that tenant; the reused
// JoinButton renders the correct join affordance (login / join / role). Rows and
// grid cards are siblings-not-nested to avoid nested interactive elements.
function DirectoryCard({ tenant, view }: { tenant: PublicTenant; view: "list" | "grid" }) {
  const open = () => openApp("komunitas", tenant.name, [tenant.slug]);

  if (view === "grid") {
    return (
      <li className="group flex flex-col gap-3 rounded-[var(--radius-win)] border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-accent/40">
        <button
          type="button"
          onClick={open}
          className="flex min-w-0 flex-col gap-1.5 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex flex-wrap items-center gap-2">
            <span className="min-w-0 truncate font-serif text-base font-medium group-hover:text-primary">
              {tenant.name}
            </span>
            {tenant.track ? <Badge tone="muted">{tenant.track}</Badge> : null}
          </span>
          <span className="line-clamp-2 text-sm text-muted-foreground">{tenant.description}</span>
        </button>
        <div className="mt-auto min-w-0 border-t border-border pt-3">
          <JoinButton
            tenantId={tenant._id}
            loginHref="/masuk"
            className="h-auto min-h-9 w-full justify-center whitespace-normal py-1.5 text-center"
          />
        </div>
      </li>
    );
  }

  return (
    <li className="group flex items-center justify-between gap-4 rounded-[var(--radius-win)] border border-border bg-card px-5 py-4 transition-colors hover:border-primary/40 hover:bg-accent/40">
      <button
        type="button"
        onClick={open}
        className="flex min-h-11 min-w-0 flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 flex-1 truncate font-serif font-medium group-hover:text-primary">
            {tenant.name}
          </span>
          {tenant.track ? <Badge tone="muted">{tenant.track}</Badge> : null}
        </span>
        <span className="truncate text-sm text-muted-foreground">{tenant.description}</span>
      </button>
      <JoinButton tenantId={tenant._id} loginHref="/masuk" className="shrink-0" />
    </li>
  );
}

function ExploreSection() {
  // ponytail: load up to 48 so the client-side name search is exhaustive for realistic
  // active-community counts; add a server-side name query if it ever exceeds this.
  const tenants = useQuery(tenantsApi.listActive, { limit: 48 }) as PublicTenant[] | undefined;
  const [openRequest, setOpenRequest] = useState(false);
  // Presentational-only view state: search filters the loaded list by name,
  // ViewToggle switches list⇄grid. No effect on data fetching.
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");

  const q = query.trim().toLowerCase();
  const visible = tenants?.filter((t) => t.name.toLowerCase().includes(q));
  const gridClass =
    view === "grid"
      ? "grid gap-3 @sm:grid-cols-2 @xl:grid-cols-3 @4xl:grid-cols-4"
      : "grid gap-3 @3xl:grid-cols-2";

  return (
    <section className="space-y-4">
      <SectionHeader
        eyebrow="Jelajahi"
        title="Komunitas aktif."
        actions={
          <>
            {visible && visible.length > 0 ? (
              <ViewToggle value={view} onChange={setView} />
            ) : null}
            <Button
              variant="outline"
              className="min-h-11 shrink-0 gap-1.5 @sm:min-h-9"
              onClick={() => setOpenRequest(true)}
            >
              <Plus className="size-4" aria-hidden />
              Ajukan komunitas
            </Button>
          </>
        }
      />

      {tenants && tenants.length > 0 ? (
        <CommandSearch
          value={query}
          onChange={setQuery}
          placeholder="Cari komunitas…"
        />
      ) : null}

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
      ) : visible && visible.length === 0 ? (
        <p className="rounded-[var(--radius-win)] border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          Tidak ada komunitas yang cocok dengan “{query}”.
        </p>
      ) : (
        <ul className={gridClass}>
          {visible?.map((tenant) => (
            <DirectoryCard key={tenant._id} tenant={tenant} view={view} />
          ))}
        </ul>
      )}

      {/* RequestTenantForm self-contains the mutation + toasts + its own signed-out
          state, so this trigger just opens it; onSuccess closes the dialog. */}
      <ResponsiveDialog open={openRequest} onOpenChange={setOpenRequest} size="lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Ajukan komunitas baru</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <RequestTenantForm onSuccess={() => setOpenRequest(false)} />
        </ResponsiveDialogBody>
      </ResponsiveDialog>
    </section>
  );
}

function CommunityDirectory() {
  return (
    <div className="w-full space-y-10 p-6 @md:p-8">
      <Hero
        eyebrow="Komunitas belajar AI · Bahasa Indonesia"
        title={
          <>
            Temukan <em className="italic text-primary">komunitasmu</em>.
          </>
        }
        description="Gabung komunitas belajar, buka kelasnya, dan catat progresmu — gratis, berbahasa Indonesia."
      />

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
