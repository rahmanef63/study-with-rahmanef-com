"use client";

// Kalender — per-session instructor+ actions: Ubah and Batalkan.
//
// Renders nothing at all for a learner, and the gate is UX only: both mutations
// go through requireInstructorForEvent, which checks the role against the
// EVENT's own tenant before it reads anything.
//
// Batalkan is a SOFT cancel (canceledAt) — members may already have the session
// in their own calendar, so the row is never deleted. Canceled rows drop out of
// both public lists server-side, so there is nothing to filter here; the button
// plus a two-step confirm is the whole UI.
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMyMembership } from "@/features/tenants";
import { Button } from "@/components/ui/button";
import { FormAcara, type NilaiAcara } from "./form-acara";
import { pesanGagalAcara, wibInputToEpoch, wibInputValue, type AcaraPublik } from "./acara-lib";

export function AksiPengajar({
  tenantId,
  acara,
}: {
  tenantId: Id<"tenants">;
  /** The server-rendered projection; locationUrl is filled in client-side. */
  acara: AcaraPublik;
}) {
  const { membership } = useMyMembership(tenantId);
  const baris = useQuery(api.features.events.queries.publicListUpcoming, { tenantId });
  const ubah = useMutation(api.features.events.mutations.update);
  const batalkan = useMutation(api.features.events.mutations.cancel);
  const [menyunting, setMenyunting] = useState(false);
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const bolehKelola = membership?.role === "instructor" || membership?.role === "owner";
  if (!bolehKelola) return null;

  // An instructor is a member, so the authenticated read carries the real link.
  const kini = baris?.find((row) => row._id === acara._id) ?? acara;
  const awal: NilaiAcara = {
    title: kini.title,
    description: kini.description ?? "",
    startsAt: wibInputValue(kini.startsAt),
    endsAt: kini.endsAt === null ? "" : wibInputValue(kini.endsAt),
    locationUrl: kini.locationUrl ?? "",
    repeatWeekly: 1,
  };

  const simpan = async (nilai: NilaiAcara): Promise<boolean> => {
    const startsAt = wibInputToEpoch(nilai.startsAt);
    if (startsAt === null) {
      toast.error("Waktu mulai belum diisi.");
      return false;
    }
    const endsAt = wibInputToEpoch(nilai.endsAt);
    setIsPending(true);
    try {
      await ubah({
        eventId: acara._id,
        title: nilai.title,
        // "" is meaningful on UPDATE: it CLEARS the stored value.
        description: nilai.description.trim(),
        locationUrl: nilai.locationUrl.trim(),
        startsAt,
        // endsAt cannot be cleared by the backend, so only send a real one.
        ...(endsAt === null ? {} : { endsAt }),
      });
      toast.success("Sesi diperbarui.");
      setMenyunting(false);
      return true;
    } catch (error) {
      toast.error(pesanGagalAcara(error));
      return false;
    } finally {
      setIsPending(false);
    }
  };

  const jalankanBatal = async () => {
    setIsPending(true);
    try {
      await batalkan({ eventId: acara._id });
      toast.success("Sesi dibatalkan. Anggota tidak melihatnya lagi.");
    } catch (error) {
      toast.error(pesanGagalAcara(error));
    } finally {
      setIsPending(false);
      setKonfirmasi(false);
    }
  };

  if (menyunting) {
    return (
      <div className="mt-4 border-t border-border pt-4">
        <span className="eyebrow">Ubah sesi</span>
        <div className="mt-3">
          <FormAcara
            mode="ubah"
            awal={awal}
            isPending={isPending}
            onSubmit={simpan}
            onBatal={() => setMenyunting(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
      <span className="eyebrow">Pengajar</span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setMenyunting(true)}
        disabled={isPending}
      >
        Ubah
      </Button>
      {konfirmasi ? (
        <>
          <span className="text-xs text-muted-foreground">Batalkan sesi ini?</span>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={() => void jalankanBatal()}
            disabled={isPending}
          >
            {isPending ? "Membatalkan…" : "Ya, batalkan"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setKonfirmasi(false)}
            disabled={isPending}
          >
            Tidak
          </Button>
        </>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setKonfirmasi(true)}
          disabled={isPending}
        >
          Batalkan
        </Button>
      )}
    </div>
  );
}
