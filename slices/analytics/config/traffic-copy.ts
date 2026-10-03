export const PLATFORM_TRAFFIC_COPY = {
  period: "Rentang trafik", days: "hari", dates: "Rentang tanggal", pageViews: "Page views", sessions: "Sesi browser", ctaClicks: "Klik CTA", directViews: "Direct / sumber tidak tersedia", droppedEvents: "Event ditolak",
  summary: "Ringkasan pengunjung", daily: "Trafik harian", dailyHint: "Tanggal memakai WIB. Sesi harian tidak dapat dijumlahkan sebagai sesi unik seluruh periode.", dailyDetails: "Lihat angka per hari", day: "Tanggal",
  hours: "Jam lokal pengunjung", hoursHint: "Page views menurut jam perangkat browser; timezone tidak mengungkap negara atau kota.", hour: "Jam", count: "Page views", hourDetails: "Lihat angka per jam",
  topPaths: "Halaman paling sering dibuka", topReferrers: "Website pengarah", topSources: "UTM source", topCampaigns: "UTM campaign", topViewports: "Ukuran layar", topBrowsers: "Browser", topOs: "Sistem operasi", topLanguages: "Bahasa browser", topTimezones: "Zona waktu browser", topCountries: "Negara (GeoIP)", topCities: "Kota (perkiraan GeoIP)", topCtas: "CTA yang diklik",
  ranking: "Kategori", events: "Event", rankings: "Rincian trafik", search: "Cari kategori trafik", scroll: "Geser tabel ke samping untuk melihat kolom lainnya.",
  recent: "Sesi terbaru", recentHint: "ID tersamarkan hanya untuk membedakan sesi sementara, bukan akun atau identitas orang. Waktu memakai WIB.", firstSeen: "Pertama dalam rentang", lastSeen: "Terakhir terlihat", session: "Sesi", lastPath: "Halaman terakhir", referrer: "Sumber", viewport: "Layar", browser: "Browser", os: "Sistem operasi", country: "Negara (GeoIP)", city: "Kota (perkiraan)",
  sort: "Urutkan", export: "Unduh CSV", ascending: "Naik", descending: "Turun", rows: "baris", complete: "Lengkap", partial: "Sebagian", completeness: "Cakupan data",
  unknown: "Tidak tersedia", direct: "Direct / tidak tersedia", mobile: "Mobile", tablet: "Tablet", desktop: "Desktop",
  empty: "Belum ada data yang cocok. Data hanya tersedia sejak pelacakan diaktifkan.", noActivity: "Belum ada page view tercatat dalam rentang ini.",
  privacy: "Definisi, privasi, dan cakupan", sessionNote: "Sesi browser bukan jumlah orang unik. ID acak disimpan sementara di sessionStorage dan tidak mengenali orang lintas sesi. Data berasal dari pelacakan first-party; pemblokir, JavaScript nonaktif, dan event yang gagal dikirim tidak tercakup.",
  privacyNote: "Tidak menyimpan nama, email, akun, raw IP, cookie autentikasi, query string, atau isi materi/komentar. Sumber kunjungan berupa hostname; campaign disaring. Negara dan kota hanya tampil jika lookup GeoIP lokal tersedia; lokasi tidak ditebak dari bahasa atau timezone. Nilai yang tidak tersedia tetap ditandai sebagai tidak tersedia.",
  geoNote: "Negara dan kota adalah perkiraan GeoIP lokal DB-IP City Lite, dataset September 2026. Bukan GPS atau alamat pasti; VPN, jaringan operator, dan data yang belum diperbarui dapat menghasilkan lokasi berbeda. IP digunakan saat request untuk lookup lokal; raw IP tidak disimpan dalam data analitik.",
  geoAttribution: "IP Geolocation by DB-IP",
  retentionBound: "Data pengunjung disimpan",
  retentionNote: "Retensi maksimal 30 hari. Inventaris historis sebelum pelacakan tidak direkonstruksi. Event yang ditolak berasal dari batas penerimaan server; tidak mengukur seluruh kegagalan pengiriman browser.",
  earliest: "Event tersimpan paling awal", earliestNote: "Ini event paling awal yang masih tersimpan, bukan tanggal pasti pertama kali pelacakan diaktifkan.",
  capped: "Pembacaan event mencapai batas. Angka bertanda ≥ adalah minimum; ranking, sesi, dan CSV hanya mencakup event yang berhasil dibaca.",
  source: "Sumber", rowsRead: "Baris dibaca", loading: "Memuat statistik pengunjung…", error: "Statistik pengunjung gagal dimuat. Periksa koneksi lalu coba lagi.",
} as const;
export type PlatformTrafficCopy = { [K in keyof typeof PLATFORM_TRAFFIC_COPY]: string };
export type PlatformTrafficCopyOverride = Partial<PlatformTrafficCopy>;
export const mergePlatformTrafficCopy = (copy?: PlatformTrafficCopyOverride): PlatformTrafficCopy => ({ ...PLATFORM_TRAFFIC_COPY, ...copy });
