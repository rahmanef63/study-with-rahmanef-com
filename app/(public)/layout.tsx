import { MarketingFooter, MarketingHeader } from "@/features/marketing-chrome";

const BRAND = { name: "belajar-with-rahmanef.com", href: "/" };
const COPYRIGHT_YEAR = 2026;

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <MarketingHeader
        brand={BRAND}
        nav={[
          { label: "Beranda", href: "/" },
          { label: "Komunitas", href: "/#komunitas" },
          { label: "Tentang", href: "/#tentang" },
        ]}
        cta={{ label: "Masuk", href: "/login" }}
        sticky
      />
      <main className="flex-1">{children}</main>
      <MarketingFooter
        brand={BRAND}
        copyright={`© ${COPYRIGHT_YEAR} belajar-with-rahmanef.com — proyek nirlaba untuk belajar AI bersama.`}
        layout="slim"
      />
    </div>
  );
}
