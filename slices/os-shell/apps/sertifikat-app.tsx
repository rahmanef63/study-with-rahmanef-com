"use client";
// Sertifikat — the public certificate viewer app (#27, mounts STATUS #24).
// Deep-link: /sertifikat/<completionId>. Fully ANONYMOUS by design (§6 etalase
// — publicGetCertificate re-checks published course + active tenant server-side
// and answers a uniform NOT_FOUND otherwise), so there is NO login gate here:
// a shared certificate link must open for anyone. All fetch/skeleton/not-found
// states live inside CertificateView; this app only wires the deep link + the
// shareable URL for the copy button.
import { type AppProps } from "@/features/appshell";
import { CertificateView } from "@/features/profiles";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { seg } from "./_nav";

export default function SertifikatApp(props: AppProps) {
  const [completionId] = seg(props.payload);

  if (!completionId) {
    return (
      <div className="w-full p-6 @sm:p-8">
        <Empty className="mx-auto max-w-2xl border">
          <EmptyHeader>
            <EmptyTitle className="font-serif">Sertifikat belum dipilih</EmptyTitle>
            <EmptyDescription className="text-pretty">
              Buka sertifikat lewat tautannya (/sertifikat/…) atau dari lencana di halaman
              profil seseorang.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  // Host-supplied share URL (never hardcoded in the slice). Window apps render
  // client-side only, but guard anyway so a future SSR pass stays safe.
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/sertifikat/${encodeURIComponent(completionId)}`
      : undefined;

  return (
    <div className="w-full p-6 @sm:p-8">
      <CertificateView completionId={completionId} shareUrl={shareUrl} />
    </div>
  );
}
