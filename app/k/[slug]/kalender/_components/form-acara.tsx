"use client";

// Kalender — the shared session form. Presentational: the parent owns the
// mutation, this owns the field state. Used twice, for `create`/`createRecurring`
// (mode="buat") and for `update` (mode="ubah").
//
// Dates are native <input type="datetime-local"> — no picker library. The value
// it produces has no timezone, so the parent runs it through wibInputToEpoch
// (acara-lib.ts) and the label below says WIB out loud.
import { useId, useState, type FormEvent } from "react";
import { EVENT_LIMITS } from "@convex/features/events/validate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type NilaiAcara = {
  title: string;
  description: string;
  /** datetime-local strings, read as WIB by the parent. */
  startsAt: string;
  endsAt: string;
  locationUrl: string;
  /** Total occurrences. 1 = one session (`create`); >1 → `createRecurring`. */
  repeatWeekly: number;
};

export const NILAI_ACARA_KOSONG: NilaiAcara = {
  title: "",
  description: "",
  startsAt: "",
  endsAt: "",
  locationUrl: "",
  repeatWeekly: 1,
};

const FIELD =
  "border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50";

export function FormAcara({
  mode,
  awal = NILAI_ACARA_KOSONG,
  isPending = false,
  onSubmit,
  onBatal,
}: {
  mode: "buat" | "ubah";
  awal?: NilaiAcara;
  isPending?: boolean;
  /** Resolve true to reset the form (create) or close it (edit). */
  onSubmit: (nilai: NilaiAcara) => Promise<boolean>;
  onBatal?: () => void;
}) {
  const id = useId();
  const [nilai, setNilai] = useState<NilaiAcara>(awal);
  const set = <K extends keyof NilaiAcara>(key: K, value: NilaiAcara[K]) =>
    setNilai((prev) => ({ ...prev, [key]: value }));

  const kirim = async (e: FormEvent) => {
    e.preventDefault();
    const berhasil = await onSubmit(nilai);
    if (berhasil && mode === "buat") setNilai(NILAI_ACARA_KOSONG);
  };

  return (
    <form onSubmit={kirim} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor={`${id}-judul`}>Judul sesi</Label>
        <Input
          id={`${id}-judul`}
          value={nilai.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Live coding: bikin agen pertama"
          minLength={EVENT_LIMITS.titleMin}
          maxLength={EVENT_LIMITS.titleMax}
          disabled={isPending}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${id}-deskripsi`}>Deskripsi (opsional)</Label>
        <textarea
          id={`${id}-deskripsi`}
          value={nilai.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Apa yang dibahas, siapa yang cocok ikut, apa yang perlu disiapkan."
          rows={3}
          maxLength={EVENT_LIMITS.descriptionMax}
          disabled={isPending}
          className={cn(FIELD, "field-sizing-content min-h-20 w-full")}
        />
      </div>

      <div className="grid gap-4 @sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`${id}-mulai`}>Mulai (WIB)</Label>
          <input
            id={`${id}-mulai`}
            type="datetime-local"
            value={nilai.startsAt}
            onChange={(e) => set("startsAt", e.target.value)}
            disabled={isPending}
            required
            className={cn(FIELD, "h-9 w-full")}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${id}-selesai`}>Selesai (opsional, WIB)</Label>
          <input
            id={`${id}-selesai`}
            type="datetime-local"
            value={nilai.endsAt}
            min={nilai.startsAt || undefined}
            onChange={(e) => set("endsAt", e.target.value)}
            disabled={isPending}
            className={cn(FIELD, "h-9 w-full")}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`${id}-link`}>Link gabung (opsional)</Label>
        <Input
          id={`${id}-link`}
          type="url"
          inputMode="url"
          value={nilai.locationUrl}
          onChange={(e) => set("locationUrl", e.target.value)}
          placeholder="https://discord.gg/…"
          pattern="https://.*"
          maxLength={EVENT_LIMITS.locationUrlMax}
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Harus https. Link ini cuma kelihatan oleh anggota komunitas.
        </p>
      </div>

      {mode === "buat" ? (
        <div className="grid gap-2">
          <Label htmlFor={`${id}-ulang`}>Ulangi mingguan</Label>
          <Input
            id={`${id}-ulang`}
            type="number"
            min={1}
            max={EVENT_LIMITS.maxRepeatWeekly}
            step={1}
            value={nilai.repeatWeekly}
            onChange={(e) => {
              const n = Number.parseInt(e.target.value, 10);
              // Clamp here so the server cap never has to reject the submit.
              set(
                "repeatWeekly",
                Number.isNaN(n) ? 1 : Math.min(Math.max(n, 1), EVENT_LIMITS.maxRepeatWeekly)
              );
            }}
            disabled={isPending}
            className="w-28"
          />
          <p className="text-xs text-muted-foreground">
            1 = sekali saja. Maksimal {EVENT_LIMITS.maxRepeatWeekly}× (satu kuartal), dibuat
            sebagai {EVENT_LIMITS.maxRepeatWeekly} sesi terpisah yang bisa diubah satu-satu.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isPending} className="min-h-11 @sm:min-h-9">
          {isPending ? "Menyimpan…" : mode === "buat" ? "Jadwalkan" : "Simpan perubahan"}
        </Button>
        {onBatal ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onBatal}
            disabled={isPending}
            className="min-h-11 @sm:min-h-9"
          >
            Batal
          </Button>
        ) : null}
      </div>
    </form>
  );
}
