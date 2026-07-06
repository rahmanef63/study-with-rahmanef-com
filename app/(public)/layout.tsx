import { PublicHeader } from "@/components/public-header";
import { MarketingFooter } from "@/features/marketing-chrome";

const BRAND = { name: "belajar-with-rahmanef.com", href: "/" };
const COPYRIGHT_YEAR = 2026;

const FOOTER_COLUMNS = [
  {
    heading: "Belajar",
    links: [
      { label: "Komunitas", href: "/#komunitas" },
      { label: "Cara kerja", href: "/#cara-kerja" },
      { label: "Buka komunitas", href: "/buka-komunitas" },
    ],
  },
  {
    heading: "Platform",
    links: [
      { label: "Tentang", href: "/#tentang" },
      { label: "Masuk", href: "/login" },
      // Text link (not the social row) — lucide has no GitHub brand glyph.
      { label: "Kode sumber (GitHub)", href: "https://github.com/rahmanef63/study-with-rahmanef-com" },
    ],
  },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <MarketingFooter
        brand={BRAND}
        columns={FOOTER_COLUMNS}
        copyright={`© ${COPYRIGHT_YEAR} belajar-with-rahmanef.com — proyek nirlaba untuk belajar AI bersama.`}
      />
    </div>
  );
}
