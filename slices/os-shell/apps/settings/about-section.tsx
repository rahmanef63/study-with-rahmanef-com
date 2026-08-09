"use client";

// Tentang — read-only system info + a safe reset. No destructive host state here:
// the only action clears the theme-preset choice, falling back to the site default.
import { RotateCcw } from "lucide-react";
import { getShell, useActiveShell, toast } from "@/features/appshell";
import { useThemePreset } from "@/features/theme-presets";
import { useCurrentProfile } from "@/features/profiles";
import { Button } from "@/components/ui/button";
import { BRAND } from "../../manifest";

// Static build label — package.json version is 0.0.0 (unset), so a hand-set string
// is more honest than surfacing that, and avoids leaking build internals.
const APP_VERSION = "1.0";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right font-medium">{value}</span>
    </div>
  );
}

export function AboutSection() {
  const { id, surface } = useActiveShell();
  const { presetName, setPreset } = useThemePreset();
  const { isAuthenticated, profile } = useCurrentProfile();
  const shell = getShell(id);

  const who = profile?.username ? `@${profile.username}` : profile?.displayName ?? "kamu";
  const rows = [
    { label: "Aplikasi", value: BRAND.name },
    { label: "Versi", value: APP_VERSION },
    { label: "Tampilan OS", value: `${shell?.label ?? id} · ${surface === "mobile" ? "Sentuh" : "Lebar"}` },
    { label: "Tema", value: presetName ?? "Bawaan" },
    { label: "Status", value: isAuthenticated ? `Masuk sebagai ${who}` : "Belum masuk" },
  ];

  return (
    <div className="space-y-5">
      <div className="divide-y rounded-xl border bg-card px-4">
        {rows.map((r) => (
          <InfoRow key={r.label} label={r.label} value={r.value} />
        ))}
      </div>
      <div className="space-y-2">
        <Button
          variant="outline"
          className="gap-1.5"
          onClick={() => {
            setPreset(null);
            toast("Preferensi tampilan direset ke bawaan.");
          }}
        >
          <RotateCcw className="size-4" />
          Reset preferensi tampilan
        </Button>
        <p className="text-xs text-muted-foreground">
          Mengembalikan tema ke bawaan. Tidak menghapus akun atau data belajarmu.
        </p>
      </div>
    </div>
  );
}
