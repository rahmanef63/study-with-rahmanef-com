// Default UI copy — Bahasa Indonesia, technical terms stay English
// (AGENTS.md §7). Consumers override any subset via the `labels` prop.
import type { ProfileLabels } from "../types";

export const DEFAULT_PROFILE_LABELS: ProfileLabels = {
  title: "Pengaturan Profil",
  subtitle: "Atur identitas publikmu di platform ini.",
  usernameLabel: "Username",
  usernameHelp:
    "3-30 karakter: huruf kecil, angka, atau tanda hubung. Dipakai untuk halaman profil publikmu.",
  usernameChecking: "Mengecek ketersediaan…",
  usernameAvailable: "Username tersedia",
  usernameTaken: "Username sudah dipakai, coba yang lain",
  usernameInvalid:
    "Username harus 3-30 karakter huruf kecil, angka, atau tanda hubung",
  displayNameLabel: "Nama tampilan",
  bioLabel: "Bio",
  bioPlaceholder: "Ceritakan sedikit tentang dirimu (opsional)",
  avatarUrlLabel: "URL avatar",
  avatarUrlHelp: "Tautan gambar https:// (opsional). Kosongkan untuk menghapus.",
  save: "Simpan",
  saving: "Menyimpan…",
  saved: "Profil tersimpan",
  viewPublicProfile: "Lihat profil publik",
  signInPrompt: "Silakan login dulu untuk mengatur profilmu.",
  signInAction: "Masuk",
  preparingProfile: "Menyiapkan profilmu…",
  errors: {
    NOT_AUTHENTICATED: "Silakan login dulu",
    NOT_AUTHORIZED: "Kamu tidak punya akses untuk aksi ini",
    NOT_FOUND: "Profil tidak ditemukan",
    VALIDATION_FAILED: "Data belum valid, periksa lagi isian formulir",
    RATE_LIMITED: "Terlalu sering, coba lagi sebentar lagi",
  },
  errorFallback: "Terjadi kesalahan, coba lagi",
};
