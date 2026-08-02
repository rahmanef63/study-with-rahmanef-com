// notifications slice — default UI copy (Bahasa Indonesia; technical terms
// stay English per AGENTS.md §7). Props-driven: every surface takes a partial
// override so the slice stays portable (no hardcoded consumer copy).
export const NOTIFICATIONS_COPY = {
  // ── bell ──
  bellLabel: "Notifikasi",
  /** Rendered when unreadCount hits the server cap. */
  unreadOverflow: "99+",

  // ── inbox ──
  inboxTitle: "Notifikasi",
  markAllRead: "Tandai semua dibaca",
  unreadBadgeLabel: "belum dibaca",
  emptyTitle: "Belum ada notifikasi",
  emptyHint: "Balasan diskusi dan kabar komunitas akan muncul di sini",
  markAllSuccess: "Semua notifikasi ditandai dibaca",

  // ── errors (ConvexError.code → copy) ──
  errNotAuthenticated: "Silakan login dulu",
  errNotAuthorized: "Kamu tidak punya akses untuk aksi ini",
  errNotFound: "Notifikasi tidak ditemukan",
  errUnknown: "Terjadi kesalahan — coba lagi",
} as const;

/** Widened to string so consumers can override with their own copy. */
export type NotificationsCopy = { [K in keyof typeof NOTIFICATIONS_COPY]: string };
export type NotificationsCopyOverride = Partial<NotificationsCopy>;

export function mergeNotificationsCopy(
  override?: NotificationsCopyOverride
): NotificationsCopy {
  return override ? { ...NOTIFICATIONS_COPY, ...override } : NOTIFICATIONS_COPY;
}
