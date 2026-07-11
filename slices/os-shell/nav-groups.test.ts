import { describe, it, expect } from "vitest";
import { groupApps } from "./nav-groups";

// groupApps only reads `.id`; a minimal stub is enough (type-only AppDescriptor
// import is erased, so this runs under vitest's no-@/alias config).
const app = (id: string) => ({ id, title: id }) as never;
const ALL = [
  "beranda", "komunitas", "kelas", "kuis", "resources", "pengumuman",
  "kelola", "profil", "pengaturan", "docs", "changelog", "admin",
];

describe("groupApps", () => {
  it("places every app exactly once and keeps Platform = docs+changelog", () => {
    const groups = groupApps(ALL.map(app));
    const flat = groups.flatMap((g) => g.apps.map((a) => a.id));
    expect(flat.slice().sort()).toEqual(ALL.slice().sort());
    expect(new Set(flat).size).toBe(flat.length);
    expect(groups.find((g) => g.label === "Platform")?.apps.map((a) => a.id))
      .toEqual(["docs", "changelog", "admin"]);
  });

  it("buckets an ungrouped app into Lainnya", () => {
    const groups = groupApps([app("beranda"), app("mystery")]);
    expect(groups.find((g) => g.label === "Lainnya")?.apps.map((a) => a.id))
      .toEqual(["mystery"]);
  });

  it("drops groups whose apps are absent", () => {
    expect(groupApps([app("beranda")]).map((g) => g.label)).toEqual(["Ruang"]);
  });
});
