// Kalender — the server-rendered agenda. No "use client": every title, date and
// description below is real HTML, which is the whole reason publicListUpcoming
// is on the anonymous etalase whitelist. Only the join link and the instructor
// controls are islands.
import type { Id } from "@convex/_generated/dataModel";
import { Badge } from "@/components/mockup-kit";
import { Card, CardContent } from "@/components/ui/card";
import { AksiPengajar } from "./aksi-pengajar";
import { TautanGabung } from "./tautan-gabung";
import { kelompokkanPerHari, labelHari, labelRentang, type AcaraPublik } from "./acara-lib";

function Waktu({ acara }: { acara: AcaraPublik }) {
  return (
    <time
      dateTime={new Date(acara.startsAt).toISOString()}
      className="border border-primary/40 bg-primary/10 px-2 py-0.5 font-display text-[10px] leading-5 text-primary"
    >
      {labelRentang(acara.startsAt, acara.endsAt)}
    </time>
  );
}

function KartuAcara({
  tenantId,
  slug,
  acara,
  berikutnya,
}: {
  tenantId: Id<"tenants">;
  slug: string;
  acara: AcaraPublik;
  berikutnya: boolean;
}) {
  return (
    <Card className="gap-0 py-5">
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Waktu acara={acara} />
          {berikutnya ? <Badge tone="accent">Sesi berikutnya</Badge> : null}
        </div>
        <h4 className="text-base font-semibold [overflow-wrap:anywhere]">{acara.title}</h4>
        {acara.description !== null ? (
          <p className="max-w-2xl whitespace-pre-line text-pretty text-sm text-muted-foreground">
            {acara.description}
          </p>
        ) : null}
        {/* Renders null when the session has no link at all — no wrapper, so a
            linkless session leaves no empty row behind. */}
        <TautanGabung
          tenantId={tenantId}
          slug={slug}
          eventId={acara._id}
          hasLocation={acara.hasLocation}
        />
        <AksiPengajar tenantId={tenantId} acara={acara} />
      </CardContent>
    </Card>
  );
}

export function AgendaMendatang({
  tenantId,
  slug,
  acara,
}: {
  tenantId: Id<"tenants">;
  slug: string;
  acara: AcaraPublik[];
}) {
  const hari = kelompokkanPerHari(acara);
  return (
    <div className="space-y-8">
      {hari.map((h, indexHari) => (
        <section key={h.key} className="space-y-3">
          <h3 className="font-display text-[11px] uppercase tracking-wide text-muted-foreground">
            {h.label}
          </h3>
          <ul className="space-y-3">
            {h.acara.map((item, index) => (
              <li key={item._id}>
                <KartuAcara
                  tenantId={tenantId}
                  slug={slug}
                  acara={item}
                  berikutnya={indexHari === 0 && index === 0}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/**
 * The archive. Collapsed <details> — native disclosure, no JS, and it keeps a
 * long history from burying the next session. publicListPast already returns
 * most-recent-first, so the order is inherited, never re-sorted.
 */
export function ArsipAcara({
  tenantId,
  slug,
  acara,
}: {
  tenantId: Id<"tenants">;
  slug: string;
  acara: AcaraPublik[];
}) {
  if (acara.length === 0) return null;
  return (
    <details className="rounded-[var(--radius)] border border-border bg-card/40 px-4 py-3 shadow-sm">
      <summary className="cursor-pointer font-display text-[11px] uppercase tracking-wide text-muted-foreground marker:text-primary">
        Arsip sesi ({acara.length})
      </summary>
      <ul className="mt-4 space-y-4">
        {acara.map((item) => (
          <li key={item._id} className="space-y-1.5 border-t border-border pt-3 first:border-0 first:pt-0">
            <p className="text-xs text-muted-foreground">
              {labelHari(item.startsAt)} · {labelRentang(item.startsAt, item.endsAt)}
            </p>
            <h4 className="text-sm font-semibold [overflow-wrap:anywhere]">{item.title}</h4>
            <TautanGabung
              tenantId={tenantId}
              slug={slug}
              eventId={item._id}
              hasLocation={item.hasLocation}
              lampau
            />
          </li>
        ))}
      </ul>
    </details>
  );
}
