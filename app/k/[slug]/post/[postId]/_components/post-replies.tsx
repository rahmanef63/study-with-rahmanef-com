"use client";

// The permalink's member-only half.
//
// The post BODY above this is anonymous etalase (that is what makes the link
// unfurl and index); its replies are not — listByPost is
// requireTenantRole(member). Rendering the thread to a stranger would surface a
// NOT_AUTHORIZED throw in app/error.tsx, so gate first, invite second — the
// same GabungDulu the Diskusi tab used before the feed landed.
import type { Id } from "@convex/_generated/dataModel";
import { PostComments } from "@/features/comments";
import { useMyMembership } from "@/features/tenants";
import { Skeleton } from "@/components/ui/skeleton";
import { GabungDulu } from "../../../_components/gabung-dulu";

const REPLY_COPY = {
  sectionTitle: "Balasan",
  sectionSubtitle: "Ikut menjawab atau tambahkan catatanmu di post ini",
  bodyPlaceholder: "Tulis balasanmu…",
  emptyTitle: "Belum ada balasan",
  emptyHint: "Jadilah yang pertama membalas post ini",
  addSuccess: "Balasan terkirim",
  deleteConfirmTitle: "Hapus balasan?",
  deleteSuccess: "Balasan dihapus",
} as const;

export function PostReplies({
  tenantId,
  postId,
  backHref,
}: {
  tenantId: Id<"tenants">;
  postId: Id<"posts">;
  /** Where login returns to — this permalink. */
  backHref: string;
}) {
  const { membership, isAuthenticated, isAuthLoading } = useMyMembership(tenantId);

  if (isAuthLoading || (isAuthenticated && membership === undefined)) {
    return (
      <div className="space-y-3" aria-busy>
        <span className="sr-only">Memuat balasan…</span>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!isAuthenticated || membership === null) {
    return (
      <GabungDulu
        tenantId={tenantId}
        nextHref={backHref}
        description="Postnya terbuka untuk siapa saja. Balasan, suka, dan menulis post baru khusus anggota komunitas."
      />
    );
  }

  return <PostComments postId={postId} copy={REPLY_COPY} />;
}
