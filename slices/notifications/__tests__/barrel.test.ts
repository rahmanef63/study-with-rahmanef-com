/// <reference types="vite/client" />
// Barrel API contract test (DoD §5.3) — TYPE-LEVEL against the barrel,
// RUNTIME against the alias-free modules (precedent: slices/comments
// __tests__/barrel.test.ts and its vitest-alias note: `@/features/*` is not
// mapped in vitest.config.mts, and the barrel's React views must not be
// value-imported under the edge-runtime test env). `import type` is erased at
// runtime; the type assertions are enforced by `npx tsc --noEmit` (DoD §5.1).
import { ConvexError } from "convex/values";
import { describe, expect, expectTypeOf, test } from "vitest";
import type * as Barrel from "../index";
import { notificationsFeature } from "../config";
import { NOTIFICATIONS_COPY, mergeNotificationsCopy } from "../config/copy";
import { READ_TAKE, UNREAD_COUNT_CAP, UNREAD_TAKE } from "../config/limits";
import { extractNotificationsError, notificationsErrorMessage } from "../lib/errors";
import { formatRelativeTime } from "../lib/time";
import sliceJson from "../slice.json";
import manifest from "../slice.manifest.json";

describe("barrel type contract (compile-time, enforced by tsc)", () => {
  test("exports the required views, components, hooks, lib and types", () => {
    // views (integrator mounts — required by the prompt: bell + inbox)
    expectTypeOf<typeof Barrel.NotificationBell>().toBeFunction();
    expectTypeOf<typeof Barrel.NotificationInbox>().toBeFunction();
    // both views accept NO required props ({} mountable) + the onNavigate seam
    expectTypeOf<Barrel.NotificationBellProps>().toEqualTypeOf<{
      onNavigate?: (href: string) => void;
      copy?: Barrel.NotificationsCopyOverride;
      className?: string;
    }>();
    // components
    expectTypeOf<typeof Barrel.NotificationRow>().toBeFunction();
    expectTypeOf<typeof Barrel.NotificationsEmptyState>().toBeFunction();
    // hooks
    expectTypeOf<typeof Barrel.useNotifications>().toBeFunction();
    expectTypeOf<typeof Barrel.useUnreadCount>().toBeFunction();
    expectTypeOf<typeof Barrel.useMarkRead>().toBeFunction();
    expectTypeOf<typeof Barrel.useMarkAllRead>().toBeFunction();
    // lib
    expectTypeOf<typeof Barrel.formatRelativeTime>().toBeFunction();
    // safe projection shape: nullable body/href/readAt, no userId/tenantId
    expectTypeOf<Barrel.NotificationItemData["readAt"]>().toEqualTypeOf<number | null>();
    expectTypeOf<Barrel.NotificationItemData["href"]>().toEqualTypeOf<string | null>();
    expectTypeOf<Barrel.NotificationItemData>().not.toHaveProperty("userId");
    expectTypeOf<Barrel.NotificationKind>().toEqualTypeOf<
      "comment_reply" | "resource_reviewed" | "suggestion_status" | "announcement"
    >();
    expect(true).toBe(true); // runtime anchor so the test registers
  });
});

describe("barrel runtime contract (alias-free modules)", () => {
  test("feature descriptor + metadata pair versions in sync (audit:slices)", () => {
    expect(notificationsFeature.slug).toBe("notifications");
    expect(sliceJson.version).toBe(manifest.version);
    expect(sliceJson.slug).toBe("notifications");
    expect(manifest.name).toBe("notifications");
  });

  test("limits mirror the server bounds (convex/features/notifications/validate.ts)", () => {
    expect(UNREAD_TAKE).toBe(30);
    expect(READ_TAKE).toBe(20);
    expect(UNREAD_COUNT_CAP).toBe(99);
  });

  test("copy defaults are Bahasa Indonesia; mergeNotificationsCopy overrides", () => {
    expect(NOTIFICATIONS_COPY.inboxTitle).toBe("Notifikasi");
    expect(NOTIFICATIONS_COPY.emptyTitle).toBe("Belum ada notifikasi");
    const merged = mergeNotificationsCopy({ markAllRead: "Semua sudah kubaca" });
    expect(merged.markAllRead).toBe("Semua sudah kubaca");
    expect(merged.inboxTitle).toBe(NOTIFICATIONS_COPY.inboxTitle);
  });

  test("lib helpers behave canonically", () => {
    expect(formatRelativeTime(Date.now())).toBe("baru saja");
    expect(formatRelativeTime(Date.now() - 5 * 60_000)).toBe("5 menit lalu");
    expect(extractNotificationsError(new Error("x"))).toEqual({});
  });

  test("error mapping resolves typed codes to copy", () => {
    const copy = mergeNotificationsCopy();
    expect(
      notificationsErrorMessage(new ConvexError({ code: "NOT_FOUND", message: "x" }), copy)
    ).toBe(copy.errNotFound);
    expect(
      notificationsErrorMessage(new ConvexError({ code: "NOT_AUTHENTICATED", message: "x" }), copy)
    ).toBe(copy.errNotAuthenticated);
    expect(
      notificationsErrorMessage(
        new ConvexError({ code: "VALIDATION_FAILED", message: "pesan server" }),
        copy
      )
    ).toBe("pesan server"); // VALIDATION reuses the server message
    expect(notificationsErrorMessage(new Error("boom"), copy)).toBe(copy.errUnknown);
  });
});
