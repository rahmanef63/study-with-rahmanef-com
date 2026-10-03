import { describe, expect, test } from "vitest";
import { communityHref } from "@/lib/community";
import { GLOBAL_DOCK_LINKS } from "./nav-model";
import {
  accountBreadcrumbs,
  adminBreadcrumbs,
  communityBreadcrumbs,
  finishTrail,
} from "./breadcrumb-model";

const SLUG = "belajar-ai";

function labels(items: { label: string; href?: string }[]) {
  return items.map((item) => [item.label, item.href ?? null]);
}

describe("finishTrail", () => {
  test("omits a trail that would only name the current page", () => {
    expect(finishTrail([{ label: "Kelas", href: "/k/belajar-ai" }])).toEqual([]);
  });

  test("the current page is never a link", () => {
    const trail = finishTrail([
      { label: "Kelas", href: "/k/belajar-ai" },
      { label: "Dasar AI", href: "/should-not-survive" },
    ]);
    expect(trail[1]).toEqual({ label: "Dasar AI" });
    expect(trail[0]?.href).toBe("/k/belajar-ai");
  });
});

describe("top-level pages omit the trail", () => {
  test("dock and account destinations do not repeat themselves", () => {
    for (const href of ["/", "/home", "/komunitas", "/roadmap", "/mulai", "/notifikasi", "/pengaturan", "/changelog", "/masuk"]) {
      expect(accountBreadcrumbs(href), href).toEqual([]);
    }
    expect(GLOBAL_DOCK_LINKS).toHaveLength(4);
  });

  test("a community section that is already a sidebar row is omitted", () => {
    for (const path of [
      communityHref.home(SLUG),
      communityHref.materi(SLUG),
      communityHref.skills(SLUG),
      communityHref.diskusi(SLUG),
      communityHref.anggota(SLUG),
      communityHref.peringkat(SLUG),
      communityHref.kalender(SLUG),
      communityHref.tentang(SLUG),
      communityHref.cari(SLUG),
      communityHref.kelola(SLUG),
    ]) {
      expect(communityBreadcrumbs(path, SLUG), path).toEqual([]);
    }
  });

  test("a public profile is a top-level account destination", () => {
    expect(accountBreadcrumbs(communityHref.profile("abdurrahman-fakhrul"))).toEqual([]);
  });
});

describe("admin trail", () => {
  test("the index names Beranda then the current console", () => {
    expect(labels(adminBreadcrumbs("/admin"))).toEqual([
      ["Beranda", "/home"],
      ["Admin platform", null],
    ]);
  });

  test("a section links its real parents and does not link itself", () => {
    expect(labels(adminBreadcrumbs("/admin/statistik"))).toEqual([
      ["Beranda", "/home"],
      ["Admin platform", "/admin"],
      ["Statistik belajar", null],
    ]);
    expect(labels(adminBreadcrumbs("/admin/pengunjung"))).toEqual([
      ["Beranda", "/home"],
      ["Admin platform", "/admin"],
      ["Pengunjung", null],
    ]);
    expect(labels(adminBreadcrumbs("/admin/komunitas"))).toEqual([
      ["Beranda", "/home"],
      ["Admin platform", "/admin"],
      ["Komunitas", null],
    ]);
    expect(labels(adminBreadcrumbs("/admin/mcp"))).toEqual([
      ["Beranda", "/home"],
      ["Admin platform", "/admin"],
      ["MCP admin", null],
    ]);
  });

  test("a user page sits under Pengguna", () => {
    expect(labels(adminBreadcrumbs("/admin/pengguna/abc"))).toEqual([
      ["Beranda", "/home"],
      ["Admin platform", "/admin"],
      ["Pengguna", "/admin/pengguna"],
      ["Aktivitas pengguna", null],
    ]);
  });
});

describe("nested learner and community pages", () => {
  test("a class links Kelas and shows the course title", () => {
    expect(labels(communityBreadcrumbs(communityHref.course(SLUG, "dasar-ai"), SLUG, { course: "Dasar AI" }))).toEqual([
      ["Kelas", `/k/${SLUG}`],
      ["Dasar AI", null],
    ]);
  });

  test("a lesson links the class, then the course, and names the materi", () => {
    const trail = communityBreadcrumbs(communityHref.lesson(SLUG, "dasar-ai", "lesson1"), SLUG, {
      course: "Dasar AI",
      lesson: "Prompt pertama",
    });
    expect(labels(trail)).toEqual([
      ["Kelas", `/k/${SLUG}`],
      ["Dasar AI", `/k/${SLUG}/kelas/dasar-ai`],
      ["Prompt pertama", null],
    ]);
  });

  test("a quiz links the course and ends on Kuis", () => {
    expect(labels(communityBreadcrumbs(communityHref.quiz(SLUG, "dasar-ai", "quiz1"), SLUG, { course: "Dasar AI" }))).toEqual([
      ["Kelas", `/k/${SLUG}`],
      ["Dasar AI", `/k/${SLUG}/kelas/dasar-ai`],
      ["Kuis", null],
    ]);
  });

  test("materi, skills, diskusi, and the editor link their real parent", () => {
    expect(labels(communityBreadcrumbs(communityHref.materiPage(SLUG, "prompt-pertama"), SLUG, { materi: "Prompt pertama" }))).toEqual([
      ["Materi", `/k/${SLUG}/materi`],
      ["Prompt pertama", null],
    ]);
    expect(labels(communityBreadcrumbs(communityHref.skillPage(SLUG, "ringkas-email"), SLUG, { materi: "Ringkas email" }))).toEqual([
      ["Skills", `/k/${SLUG}/skills`],
      ["Ringkas email", null],
    ]);
    expect(labels(communityBreadcrumbs(communityHref.post(SLUG, "post1"), SLUG, { post: "Pengumuman" }))).toEqual([
      ["Diskusi", `/k/${SLUG}/diskusi`],
      ["Pengumuman", null],
    ]);
    expect(labels(communityBreadcrumbs(communityHref.kelolaMateri(SLUG, "lesson1"), SLUG))).toEqual([
      ["Kelola", `/k/${SLUG}/kelola`],
      ["Edit materi", null],
    ]);
  });

  test("without a title, a slug is readable and an id is not shown raw", () => {
    expect(communityBreadcrumbs(communityHref.course(SLUG, "dasar-ai"), SLUG).at(-1)?.label).toBe("dasar ai");
    expect(communityBreadcrumbs(communityHref.lesson(SLUG, "dasar-ai", "jd7abc"), SLUG).at(-1)?.label).toBe("Materi");
    expect(communityBreadcrumbs(communityHref.post(SLUG, "jd7abc"), SLUG).at(-1)?.label).toBe("Post");
  });

  test("pengaturan MCP sits under Pengaturan", () => {
    expect(labels(accountBreadcrumbs("/pengaturan/mcp"))).toEqual([
      ["Pengaturan", "/pengaturan"],
      ["MCP user", null],
    ]);
  });

  test("a query string does not turn a section index into a nested page", () => {
    expect(communityBreadcrumbs(`/k/${SLUG}/diskusi?kind=sumber`, SLUG)).toEqual([]);
  });
});
