import { describe, expect, test } from "vitest";
import { ADMIN_NAV_GROUPS, isAdminLinkActive } from "./admin-destinations";

describe("admin groups", () => {
  test("Pantau and Kelola are the existing routes, nothing else", () => {
    expect(ADMIN_NAV_GROUPS.map((group) => [group.label, group.links.map((link) => link.href)])).toEqual([
      ["Pantau", ["/admin", "/admin/statistik", "/admin/pengunjung", "/admin/pengguna"]],
      ["Kelola", ["/admin/komunitas", "/admin/mcp"]],
    ]);
  });

  test("Ringkasan stays exact and a user page lights Pengguna", () => {
    const pantau = ADMIN_NAV_GROUPS[0]?.links ?? [];
    const ringkasan = pantau[0]!;
    const pengguna = pantau[3]!;
    expect(isAdminLinkActive("/admin/statistik", ringkasan)).toBe(false);
    expect(isAdminLinkActive("/admin", ringkasan)).toBe(true);
    expect(isAdminLinkActive("/admin/pengguna/abc", pengguna)).toBe(true);
  });
});
