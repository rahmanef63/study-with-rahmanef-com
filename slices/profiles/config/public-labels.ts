// Default UI copy for the public profile page — Bahasa Indonesia, technical
// terms stay English (AGENTS.md §7). Consumers override any subset via the
// `labels` prop on PublicProfileView / BadgeWall.
import type { PublicProfileLabels } from "../types";

export const DEFAULT_PUBLIC_PROFILE_LABELS: PublicProfileLabels = {
  loading: "Memuat profil…",
  notFoundTitle: "Profil tidak ditemukan",
  notFoundBody: "Username ini belum terdaftar atau sudah diganti.",
  errorTitle: "Gagal memuat profil",
  errorBody: "Terjadi kesalahan. Coba muat ulang halaman.",
  bioEmpty: "Belum ada bio.",
  badgesTitle: "Lencana Kelas",
  badgesEmpty: "Belum ada kelas yang diselesaikan.",
  badgeEarnedPrefix: "Diselesaikan",
  copyLabel: "Salin tautan profil",
  copiedLabel: "Tersalin!",
  editLabel: "Edit profil",
};
