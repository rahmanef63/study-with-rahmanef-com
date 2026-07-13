// Default UI copy for the public certificate page (/sertifikat/<id>, STATUS
// #24) — Bahasa Indonesia, technical terms stay English (AGENTS.md §7).
// Consumers override any subset via the `labels` prop on CertificateView.
import type { CertificateLabels } from "../types";

export const DEFAULT_CERTIFICATE_LABELS: CertificateLabels = {
  loading: "Memuat sertifikat…",
  notFoundTitle: "Sertifikat tidak ditemukan",
  notFoundBody:
    "Tautan ini tidak valid, atau kelasnya sudah tidak tersedia untuk publik.",
  errorTitle: "Gagal memuat sertifikat",
  errorBody: "Terjadi kesalahan. Coba muat ulang halaman.",
  eyebrow: "Sertifikat Kelas",
  heading: "Sertifikat Penyelesaian",
  awardedTo: "Diberikan kepada",
  courseIntro: "atas penyelesaian kelas",
  communityPrefix: "di komunitas",
  earnedPrefix: "Diselesaikan pada",
  copyLabel: "Salin tautan sertifikat",
  copiedLabel: "Tersalin!",
};
