"use client";

// Papan skor — the whole Peringkat tab as one client island.
//
// Client by necessity, not by taste: listTop and getMyRank are both
// requireTenantRole(member) on their first line (a board is a MEMBER LIST, which
// §6 forbids exposing anonymously), and server components here are permanently
// anonymous. Both reads stay "skip" until membership is CONFIRMED, so a stranger
// never fires a call that would throw NOT_AUTHORIZED into app/error.tsx.
import Link from "next/link";
import { useQuery } from "convex/react";
import { Trophy } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge, SectionHeader } from "@/components/mockup-kit";
import { useCurrentProfile } from "@/features/profiles";
import { useMyMembership } from "@/features/tenants";
import { communityHref } from "@/lib/community";
import { GabungDulu } from "../../_components/gabung-dulu";
import { BarisSkor, SKOR_GRID } from "./baris-skor";
import { KartuSkorSaya } from "./kartu-skor-saya";

export function PapanSkor({ tenantId, slug }: { tenantId: Id<"tenants">; slug: string }) {
  const { membership, isAuthenticated, isAuthLoading } = useMyMembership(tenantId);
  const { profile } = useCurrentProfile();
  const isMember = isAuthenticated && membership !== undefined && membership !== null;
  const args = isMember ? { tenantId } : "skip";
  const papan = useQuery(api.features.leaderboard.queries.listTop, args);
  const skorSaya = useQuery(api.features.leaderboard.queries.getMyRank, args);

  if (isAuthLoading || (isAuthenticated && membership === undefined)) {
    return (
      <div className="space-y-3" aria-busy>
        <span className="sr-only">Memuat papan skor…</span>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (!isMember) {
    // The shared members-only gate, reused verbatim (same one Diskusi/Anggota use).
    return (
      <GabungDulu
        tenantId={tenantId}
        nextHref={communityHref.peringkat(slug)}
        title="Gabung dulu untuk lihat papan skor"
        description="Peringkat menampilkan sesama anggota, jadi hanya terbuka untuk anggota komunitas."
      />
    );
  }

  return (
    <section className="space-y-5">
      <SectionHeader
        eyebrow="Hi-Score"
        title="Papan skor"
        actions={
          papan && papan.length > 0 ? <Badge tone="muted">{papan.length} pemain</Badge> : undefined
        }
      />

      <KartuSkorSaya mine={skorSaya} />

      {/* The owner's explicit call (PRD §2.1, DECISIONS #30): points rank people,
          they never ration learning. Say it here so nobody grinds for access. */}
      <p className="border-l-2 border-accent bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        1 suka = 1 poin. Level cuma penanda keaktifan — tidak ada kelas atau materi yang dikunci di
        balik level, semuanya tetap gratis untuk semua anggota.
      </p>

      {papan === undefined ? (
        <div className="space-y-2" aria-busy>
          <span className="sr-only">Memuat peringkat…</span>
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : papan.length === 0 ? (
        <PapanKosong slug={slug} />
      ) : (
        <div className="space-y-2">
          <div className={`${SKOR_GRID} px-3 pb-1`}>
            <span className="eyebrow text-[0.5rem]">#</span>
            <span className="eyebrow text-[0.5rem]">Pemain</span>
            <span className="eyebrow text-right text-[0.5rem]">Poin</span>
          </div>
          <ol className="space-y-2">
            {papan.map((entry) => (
              <BarisSkor
                key={entry.username}
                entry={entry}
                isMe={profile?.username === entry.username}
              />
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

function PapanKosong({ slug }: { slug: string }) {
  return (
    <Empty className="border-2 border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Trophy aria-hidden />
        </EmptyMedia>
        <EmptyTitle className="font-display text-xs uppercase">Belum ada skor</EmptyTitle>
        <EmptyDescription className="text-pretty">
          Komunitas ini masih muda dan belum ada yang mengumpulkan poin. Mulai dengan menulis di
          Diskusi — setiap suka yang kamu terima bernilai 1 poin.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild variant="outline">
          <Link href={communityHref.diskusi(slug)}>Buka Diskusi</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
