"use client";

// Papan skor — the whole Peringkat tab as one client island.
//
// Client by necessity, not by taste: listTop and getMyRank are both
// requireTenantRole(member) on their first line (a board is a MEMBER LIST, which
// §6 forbids exposing anonymously), and server components here are permanently
// anonymous. Both reads stay "skip" until membership is CONFIRMED, so a stranger
// never fires a call that would throw NOT_AUTHORIZED into app/error.tsx.
//
// Screen order, top to bottom: YOUR score, then the board, then the rules. One
// primary thing (your standing), one list, one footnote — instead of the old
// eyebrow + title + badge + panel + rule box + column labels + ten cards, which
// spent ~200px before the first rank appeared.
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
import { useCurrentProfile } from "@/features/profiles";
import { useMyMembership } from "@/features/tenants";
import { communityHref } from "@/lib/community";
import { GabungDulu } from "../../_components/gabung-dulu";
import { InsetList } from "../../_components/inset-list";
import { BarisSkor } from "./baris-skor";
import { KartuSkorSaya } from "./kartu-skor-saya";

// The owner's explicit call (PRD §2.1, DECISIONS #30): points rank people, they
// never ration learning. It used to sit BETWEEN the score panel and the board,
// interrupting the one thing a player came to read. As the list's footer it is
// still unmissable and now reads as what it is — the rules of the list above it.
const ATURAN =
  "1 suka = 1 poin. Level cuma penanda keaktifan — tidak ada kelas atau materi yang dikunci di balik level, semuanya tetap gratis untuk semua anggota.";

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
        <Skeleton className="h-28 w-full" />
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
        description="Peringkat menampilkan sesama anggota, jadi hanya terbuka untuk anggota komunitas."
      />
    );
  }

  return (
    <div className="space-y-4">
      <KartuSkorSaya mine={skorSaya} />

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
        // No "#/Pemain/Poin" column strip: a numeral, a face and a number on the
        // right need no headings, and the strip cost a row's worth of height to
        // label three self-evident columns.
        <InsetList as="ol" caption={`${papan.length} pemain`} footer={ATURAN}>
          {papan.map((entry) => (
            <BarisSkor
              key={entry.username}
              entry={entry}
              isMe={profile?.username === entry.username}
            />
          ))}
        </InsetList>
      )}
    </div>
  );
}

function PapanKosong({ slug }: { slug: string }) {
  return (
    <Empty className="gap-4 border-2 border-dashed p-5 md:p-8">
      <EmptyHeader className="gap-1.5">
        <EmptyMedia variant="icon" className="mb-0 size-9">
          <Trophy aria-hidden />
        </EmptyMedia>
        <EmptyTitle className="font-display text-xs uppercase leading-relaxed">
          Belum ada skor
        </EmptyTitle>
        <EmptyDescription className="text-pretty">
          Belum ada yang mengumpulkan poin di sini. Mulai dengan menulis di Diskusi — setiap suka
          yang kamu terima bernilai 1 poin.
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
