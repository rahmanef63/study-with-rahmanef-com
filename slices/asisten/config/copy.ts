// asisten slice — props-driven copy (Bahasa Indonesia defaults, rr P1:
// no hardcoded copy inside components; everything routes through this map).

export const ASISTEN_COPY = {
  title: "Alfa — asisten belajarmu",
  subtitle: "Tanya apa saja seputar belajar AI. Kalau kamu buka dari materi, Alfa ikut membaca materinya.",
  placeholder: "Tulis pertanyaanmu…",
  send: "Kirim",
  thinking: "Alfa sedang berpikir…",
  emptyHint: "Mulai dengan pertanyaan kecil — misalnya \"jelaskan materi ini dengan analogi sederhana\".",
  lessonContextBadge: "Terhubung ke materi yang sedang dibuka",
  disclaimer: "Alfa bisa keliru. Untuk hal penting, cek ulang ke sumber tepercaya.",
  suggestions: [
    "Jelaskan dengan analogi sederhana",
    "Buatkan 3 langkah latihan praktis",
    "Apa kesalahan pemula yang umum di topik ini?",
  ],
  errNotAuthenticated: "Masuk dulu untuk ngobrol dengan Alfa, ya.",
  errNotAuthorized: "Materi ini hanya untuk anggota komunitasnya — gabung dulu untuk bertanya soal isinya.",
  errNotFound: "Alfa belum aktif atau sedang tidak bisa dihubungi. Coba lagi nanti.",
  errValidation: "Pesanmu terlalu panjang atau kosong — coba persingkat.",
  errRateLimited: "Alfa lagi ramai. Tunggu sebentar lalu coba lagi.",
  errFallback: "Ada gangguan kecil. Coba kirim ulang pesanmu.",
} as const;

export type AsistenCopy = { [K in keyof typeof ASISTEN_COPY]: (typeof ASISTEN_COPY)[K] extends readonly string[] ? readonly string[] : string };
export type AsistenCopyOverride = Partial<AsistenCopy>;

export function mergeAsistenCopy(override?: AsistenCopyOverride): AsistenCopy {
  return { ...ASISTEN_COPY, ...override };
}
