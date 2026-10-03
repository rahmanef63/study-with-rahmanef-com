// Path → breadcrumb trail. Pure data: no JSX, so the hierarchy can be tested
// without a renderer. The last crumb is the current page and never carries an
// href. A trail of one would only repeat the page title, so it is omitted.
import { communityHref } from "@/lib/community";

export type Crumb = {
  label: string;
  /** Real parent route. Absent on the current page. */
  href?: string;
};

const TOP_LEVEL = new Set([
  "/",
  "/home",
  "/komunitas",
  "/roadmap",
  "/mulai",
  "/notifikasi",
  "/pengaturan",
  "/changelog",
  "/masuk",
]);

/** Community sections that already are a dock cell or a sidebar row. */
const COMMUNITY_SECTIONS = new Set([
  "materi",
  "skills",
  "diskusi",
  "anggota",
  "peringkat",
  "kalender",
  "tentang",
  "cari",
  "kelola",
]);

const ADMIN_SECTIONS: Record<string, string> = {
  statistik: "Statistik belajar",
  pengunjung: "Pengunjung",
  pengguna: "Pengguna",
  komunitas: "Komunitas",
  mcp: "MCP admin",
};

function segments(pathname: string): string[] {
  const path = pathname.split(/[?#]/, 1)[0] ?? "";
  return path.split("/").filter(Boolean).map(decode);
}

function decode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Hyphenated route slug, only when the page has not supplied its real title. */
function slugLabel(slug: string): string {
  const text = slug.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  return text.length > 0 ? text : slug;
}

function titled(value: string | undefined, fallback: string): string {
  const text = value?.trim();
  return text ? text : fallback;
}

/** Drop a lone crumb, and never let the current page stay a link. */
export function finishTrail(items: Crumb[]): Crumb[] {
  if (items.length < 2) return [];
  return items.map((item, index) =>
    index === items.length - 1 ? { label: item.label } : item,
  );
}

export function adminBreadcrumbs(pathname: string): Crumb[] {
  const parts = segments(pathname);
  if (parts[0] !== "admin") return [];
  const root: Crumb = { label: "Beranda", href: "/home" };
  const admin: Crumb = { label: "Admin platform", href: communityHref.admin() };
  const section = parts[1];
  if (section === undefined) return finishTrail([root, { label: "Admin platform" }]);
  const label = ADMIN_SECTIONS[section];
  if (label === undefined) return [];
  if (section === "pengguna" && parts.length > 2) {
    return finishTrail([
      root,
      admin,
      { label: "Pengguna", href: communityHref.adminUsers() },
      { label: "Aktivitas pengguna" },
    ]);
  }
  return finishTrail([root, admin, { label }]);
}

/** Account pages outside a community. Top-level rows that repeat the dock or
 *  the account menu return nothing. */
export function accountBreadcrumbs(pathname: string): Crumb[] {
  const parts = segments(pathname);
  if (parts[0] === "admin") return adminBreadcrumbs(pathname);
  if (parts[0] === "pengaturan" && parts[1] === "mcp" && parts.length === 2) {
    return finishTrail([
      { label: "Pengaturan", href: "/pengaturan" },
      { label: "MCP user" },
    ]);
  }
  const bare = `/${parts.join("/")}`;
  if (bare === "/" || TOP_LEVEL.has(bare)) return [];
  if (parts[0] === "u" && parts.length === 2) return [];
  return [];
}

export type CommunityCrumbTitles = {
  course?: string;
  lesson?: string;
  materi?: string;
  post?: string;
};

export function communityBreadcrumbs(
  pathname: string,
  slug: string,
  titles?: CommunityCrumbTitles,
): Crumb[] {
  const parts = segments(pathname);
  if (parts[0] !== "k" || parts[1] !== slug) return [];
  const rest = parts.slice(2);
  if (rest.length === 0) return [];
  if (rest.length === 1 && COMMUNITY_SECTIONS.has(rest[0] ?? "")) return [];

  if (rest[0] === "kelas" && rest[1]) {
    const courseSlug = rest[1];
    const kelas: Crumb = { label: "Kelas", href: communityHref.home(slug) };
    const courseLabel = titled(titles?.course, slugLabel(courseSlug));
    const course: Crumb = { label: courseLabel, href: communityHref.course(slug, courseSlug) };
    if (rest.length === 2) return finishTrail([kelas, { label: courseLabel }]);
    if (rest[2] === "kuis" && rest[3]) return finishTrail([kelas, course, { label: "Kuis" }]);
    if (rest.length >= 3 && rest[2] !== "kuis") {
      return finishTrail([kelas, course, { label: titled(titles?.lesson, "Materi") }]);
    }
  }

  if (rest[0] === "materi" && rest[1]) {
    return finishTrail([
      { label: "Materi", href: communityHref.materi(slug) },
      { label: titled(titles?.materi, slugLabel(rest[1])) },
    ]);
  }
  if (rest[0] === "skills" && rest[1]) {
    return finishTrail([
      { label: "Skills", href: communityHref.skills(slug) },
      { label: titled(titles?.materi, slugLabel(rest[1])) },
    ]);
  }
  if (rest[0] === "post" && rest[1]) {
    return finishTrail([
      { label: "Diskusi", href: communityHref.diskusi(slug) },
      { label: titled(titles?.post, "Post") },
    ]);
  }
  if (rest[0] === "kelola" && rest[1] === "materi" && rest[2]) {
    return finishTrail([
      { label: "Kelola", href: communityHref.kelola(slug) },
      { label: "Edit materi" },
    ]);
  }
  return [];
}
