"use client";

// Kalender — the instructor+ "jadwalkan sesi" island.
//
// Client by necessity: membership can only be resolved in the browser (server
// components here are permanently anonymous), and the gate below is UX only —
// events.create / events.recurring.createRecurring both run requireTenantRole
// (instructor) as their first line.
//
// One form, two mutations: repeatWeekly === 1 is `create`, anything above it is
// `createRecurring`, which writes N discrete rows. There is no recurrence rule
// in the schema and the UI must not imply one.
import { useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { CalendarPlus } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMyMembership } from "@/features/tenants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormAcara, type NilaiAcara } from "./form-acara";
import { pesanGagalAcara, wibInputToEpoch } from "./acara-lib";

export function PanelJadwal({ tenantId }: { tenantId: Id<"tenants"> }) {
  const { membership } = useMyMembership(tenantId);
  const buat = useMutation(api.features.events.mutations.create);
  const buatBerulang = useMutation(api.features.events.recurring.createRecurring);
  const [terbuka, setTerbuka] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const bolehKelola = membership?.role === "instructor" || membership?.role === "owner";
  if (!bolehKelola) return null;

  const kirim = async (nilai: NilaiAcara): Promise<boolean> => {
    const startsAt = wibInputToEpoch(nilai.startsAt);
    if (startsAt === null) {
      toast.error("Waktu mulai belum diisi.");
      return false;
    }
    const endsAt = wibInputToEpoch(nilai.endsAt);
    const dasar = {
      tenantId,
      title: nilai.title,
      // Absent, not "": on CREATE an empty optional simply is not stored.
      description: nilai.description.trim() === "" ? undefined : nilai.description,
      startsAt,
      endsAt: endsAt ?? undefined,
      locationUrl: nilai.locationUrl.trim() === "" ? undefined : nilai.locationUrl.trim(),
    };

    setIsPending(true);
    try {
      if (nilai.repeatWeekly > 1) {
        await buatBerulang({ ...dasar, repeatWeekly: nilai.repeatWeekly });
        toast.success(`${nilai.repeatWeekly} sesi mingguan dijadwalkan.`);
      } else {
        await buat(dasar);
        toast.success("Sesi dijadwalkan.");
      }
      setTerbuka(false);
      return true;
    } catch (error) {
      toast.error(pesanGagalAcara(error));
      return false;
    } finally {
      setIsPending(false);
    }
  };

  if (!terbuka) {
    return (
      <Button
        type="button"
        onClick={() => setTerbuka(true)}
        className="min-h-11 gap-2 @sm:min-h-9"
      >
        <CalendarPlus aria-hidden />
        Jadwalkan sesi
      </Button>
    );
  }

  return (
    <Card className="py-5">
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <span className="eyebrow">Khusus pengajar</span>
          <h3 className="font-display text-xs uppercase">Jadwalkan sesi baru</h3>
        </div>
        <FormAcara
          mode="buat"
          isPending={isPending}
          onSubmit={kirim}
          onBatal={() => setTerbuka(false)}
        />
      </CardContent>
    </Card>
  );
}
