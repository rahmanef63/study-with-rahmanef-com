import { PublicHeader } from "@/components/public-header";
import { MarketingFooter } from "@/features/marketing-chrome";

const BRAND = { name: "belajar-with-rahmanef.com", href: "/" };
const COPYRIGHT_YEAR = 2026;

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <MarketingFooter
        brand={BRAND}
        copyright={`© ${COPYRIGHT_YEAR} belajar-with-rahmanef.com — proyek nirlaba untuk belajar AI bersama.`}
        layout="slim"
      />
    </div>
  );
}
