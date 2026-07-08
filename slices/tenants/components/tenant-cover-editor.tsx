"use client";
// Owner-only "add / change cover" control for a community. No upload plumbing
// exists in this app (see convex/features/courses/validate.ts) — covers are
// external https URLs, validated server-side in updateProfile. Small popover so
// it can sit on the community card corner without a full dialog.
import { useState } from "react";
import { ImagePlus } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUpdateTenantProfile } from "../hooks/use-tenant-mutations";

export function TenantCoverEditor({
  tenantId,
  currentUrl,
}: {
  tenantId: Id<"tenants">;
  currentUrl?: string;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(currentUrl ?? "");
  const [update, { isPending }] = useUpdateTenantProfile();

  const save = async (value: string) => {
    const res = await update({ tenantId, coverImageUrl: value });
    if (res) setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) setUrl(currentUrl ?? ""); }}>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="sm" className="gap-1.5 shadow-sm">
          <ImagePlus className="size-4" aria-hidden />
          {currentUrl ? "Ganti sampul" : "Tambah sampul"}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-2.5">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">Sampul komunitas</p>
          <p className="text-xs text-muted-foreground">Tempel URL gambar (https://…).</p>
        </div>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && url.trim()) void save(url.trim()); }}
          placeholder="https://contoh.com/sampul.jpg"
          aria-label="URL sampul komunitas"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary/50"
        />
        <div className="flex items-center justify-between gap-2">
          {currentUrl ? (
            <Button variant="ghost" size="sm" disabled={isPending} onClick={() => void save("")}>
              Hapus
            </Button>
          ) : (
            <span />
          )}
          <Button size="sm" disabled={isPending || !url.trim()} onClick={() => void save(url.trim())}>
            Simpan
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
