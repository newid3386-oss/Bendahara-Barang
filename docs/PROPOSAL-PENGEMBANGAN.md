# Proposal Pengembangan & Optimalisasi Aplikasi
## Sistem Informasi Sekolah dan Inventaris — UPT SD Negeri Tangerang 6 (NPSN 20606498)

**Tanggal:** 12 November 2026
**Lingkup:** analisis kebutuhan aplikasi, rencana pengembangan bertahap, dan rekomendasi peningkatan efisiensi & kecepatan
**Metode:** pembacaan kode sumber, pengukuran build produksi, dan pengukuran beban data pada aplikasi yang berjalan

---

## 1. Ringkasan Eksekutif

Aplikasi yang ada saat ini adalah **satu aplikasi web (SPA React + Express) dengan empat wajah**: website publik sekolah, portal administrasi (inventaris/BMN, persediaan, ATK, SPJ/ARKAS, dokumen), ruang kelas digital, dan panel admin. Cakupan fungsinya sudah sangat luas — jauh di atas aplikasi inventaris sekolah pada umumnya — dan kualitas kodenya cukup rapi (TypeScript lolos pemeriksaan tipe tanpa error, komponen dipisah per modul, tampilan konsisten).

Namun ada **tiga persoalan struktural** yang membatasi aplikasi ini untuk dipakai bersama sehari-hari:

1. **Data hanya hidup di browser.** Seluruh basis data (36 kunci penyimpanan, ±344 KB pada sesi terukur) disimpan pada `localStorage` per-perangkat. Bendahara, admin sarpras, dan kepala sekolah tidak melihat data yang sama, dan menghapus cache browser berarti kehilangan data.
2. **Tidak ada autentikasi di sisi server.** Login, PIN, dan hak akses diperiksa di browser; bahkan PIN `123456` dan `admin123` selalu diterima. Endpoint AI di server terbuka tanpa identitas pengguna.
3. **Bobot aplikasi besar.** Build produksi 8,2 MB; modul kelas digital diunduh sebagai satu potongan 2,6 MB (412 KB terkompresi), dan bundel utama 1,3 MB (291 KB terkompresi). Di jaringan sekolah ini terasa lambat, terutama pada perangkat lama.

Proposal ini membagi perbaikan ke dalam **6 fase (±13–17 minggu kerja untuk 1–2 pengembang)**, dengan Fase 0 berupa perbaikan keamanan & pencadangan yang bisa dikerjakan dalam hitungan hari, lalu fondasi data server, optimalisasi performa, modularisasi, sampai AI dan QA otomatis.

---

## 2. Profil Aplikasi Saat Ini

### 2.1 Modul yang sudah tersedia

| Kelompok | Modul |
|---|---|
| Publik | Website sekolah (profil, sarpras, berita/prestasi, eskul, kontak), validasi QR aset publik, tanya AI |
| Persediaan | Master barang, penyedia, barang masuk, barang keluar, persediaan, buku besar stok (ledger), pengambilan ATK, perencanaan pengadaan |
| Aset / BMN | Daftar aset, siklus hidup aset, mutasi, stock opname, pemeliharaan & penghapusan, penyusutan, konsolidasi multi-sekolah |
| Administrasi | Dokumen center, laporan, ARKAS/SiPLah, SPJ, berita acara (template & versi), audit control, RBAC & log audit |
| Sumber daya | Pegawai, akun & pengguna, konfigurasi sistem, pusat keamanan |
| Kelas digital | Jadwal, materi, media, tugas/nilai, CBT, absensi (QR/NFC), P5, portofolio, forum, peer review, analitik guru, portal orang tua |
| Pendukung | Scanner QR, cetak label/stiker QR (A4, termal), tanda tangan digital, PWA offline, sinkronisasi Firebase, integrasi Google Sheets/Drive, asisten AI |

### 2.2 Fakta teknis terukur

| Aspek | Kondisi saat ini | Bukti |
|---|---|---|
| Stack | Vite 6 + React 18 + TypeScript 5.8 + Tailwind 4; Express 4 melayani API dan SPA dalam satu proses | `package.json`, `server.ts` |
| Ukuran kode | ±127.000 baris di `src` + 1.626 baris `server.ts`, 158 berkas | `find`/`wc` |
| Berkas terbesar | `ClassroomApp.tsx` 17.722 baris; `pdfService` 4.694; `classroomService` 4.323; `QRScannerModal` 3.836; `ScanSettingsModal` 3.330; `DashboardAnalitikGuru` 3.217; `localStorageService` 2.741 | `wc -l` |
| Build produksi | **8,2 MB** total; entry `index` 1.295 kB (291 kB gzip); `ClassroomApp` 2.639 kB (412 kB gzip); `vendor-pdf` 626 kB; `vendor-firebase` 556 kB; `vendor-react` 488 kB; `vendor-xlsx` 425 kB; CSS 360 kB | `vite build` |
| Beban halaman (mode dev) | 80 permintaan, ±1.015 kB JS, DOMContentLoaded ±1,5 s | `performance.getEntriesByType('resource')` |
| Penyimpanan | 36 kunci `localStorage`, ±344 KB; `BB_ACCOUNTS` sendiri 214 KB (742 siswa + akun) | pengukuran di aplikasi |
| Pola tulis data | Setiap perubahan menulis ulang **satu koleksi penuh** (`setItem(key, list)`) secara sinkron | `localStorageService.ts` |
| Sinkronisasi | Firebase Firestore (manual + otomatis 15 menit) dan Google Sheets — keduanya opsional | `firebaseService`, `autoSyncService` |
| Autentikasi | Sepenuhnya di klien (PIN/password dibandingkan di browser); server tidak memeriksa identitas | `LoginSelectionModal`, `PinAuthModal`, `server.ts` |
| API | 9 endpoint (`/api/health`, `/api/ai/*`, `/api/reports/*`), rate limit 180/menit per IP+path, batas body 2 MB / 50 MB, cache 30 menit hanya pada `grounded-explorer`, fallback 3 model Gemini | `server.ts` |
| Kualitas tipe | `tsc --noEmit`: **0 error** | `npm run lint` |
| Pengujian | Tidak ada kerangka uji maupun berkas tes | pencarian `*.test.*`, dependensi |
| Pola React | 593 `useState`, 234 `useMemo`, 121 `useEffect`, 53 `useCallback`; 14 komponen membaca `localStorage` langsung | `grep` |

> Angka build dan beban halaman diukur pada lingkungan pratinjau (mode pengembangan untuk pengukuran halaman). Ukuran potongan (chunk) adalah angka build produksi yang sebenarnya.

---

## 3. Analisis Kebutuhan

### 3.1 Kebutuhan per pemangku kepentingan

| Pemangku kepentingan | Kebutuhan utama | Kondisi saat ini |
|---|---|---|
| **Bendahara / Admin Sarpras** | Satu sumber data yang sama dari beberapa perangkat; bukti transaksi tidak bisa hilang; laporan BMN/SPJ siap cetak; jejak audit | Data per-browser; tidak ada backup otomatis; audit tersimpan di perangkat yang sama dengan data |
| **Kepala Sekolah** | Ringkasan real-time, persetujuan pengajuan, laporan eksekutif | Dashboard ada, tetapi hanya mencerminkan data perangkat yang dipakai |
| **Guru** | Input nilai/absensi cepat, mode offline, rekap otomatis | Modul lengkap, tetapi modul kelas 2,6 MB dan seluruh data kelas di perangkat guru |
| **Siswa / Orang tua** | Akses nilai, absensi, materi, pengumuman tanpa akun guru | Portal ada, bergantung pada data lokal perangkat guru |
| **Operator / Dinas** | Konsolidasi antar-sekolah, ekspor format resmi, integrasi Dapodik/ARKAS | Konsolidasi manual antar-perangkat; data Dapodik masih ditanam di dalam kode |
| **Keamanan & kepatuhan** | Akun unik per pengguna, hak akses ditegakkan server, log tidak dapat diubah | PIN default diterima; hak akses hanya di klien |

### 3.2 Kesenjangan (gap) utama

1. **Tidak ada sumber kebenaran bersama.** Aplikasi multi-pengguna tetapi penyimpanannya per-perangkat.
2. **Ketahanan data rendah.** `localStorage` (kuota ±5–10 MB) dapat hilang saat cache dibersihkan, dan mudah penuh karena dokumen/gambar disimpan sebagai base64.
3. **Keamanan belum memadai.** PIN default selalu valid, kredensial berada di data yang dapat dibaca pengguna, token Google OAuth disimpan di browser, dan endpoint AI tanpa autentikasi.
4. **Kinerja awal berat.** Modul kelas digital diunduh utuh; dataset 742 siswa ikut dalam bundel utama.
5. **Beban render besar.** Daftar 742 siswa dan ribuan baris ledger dirender tanpa virtualisasi; setiap mutasi menulis ulang koleksi penuh.
6. **Tidak ada jaring pengaman refactor.** Tanpa tes otomatis, perubahan pada berkas 17 ribuan baris berisiko.

---

## 4. Temuan Kritis dan Prioritas

| # | Temuan | Dampak | Prioritas |
|---|---|---|---|
| 1 | `PinAuthModal` menerima `123456` dan `admin123` tanpa syarat | Siapa pun dapat membuka aksi admin | **P0** |
| 2 | Tidak ada autentikasi/otorisasi di server; `/api/ai/*` terbuka | Kuota AI dapat dipakai pihak lain; data tidak terlindungi per-peran | **P0** |
| 3 | Data hanya di `localStorage`, tanpa backup terjadwal | Kehilangan data permanen saat cache dibersihkan / perangkat rusak | **P0** |
| 4 | Kata sandi & data pengguna berada di `localStorage` klien | Kredensial dapat dibaca dari browser | **P1** |
| 5 | Token akses Google disimpan di `localStorage` | Token dapat dipakai ulang jika perangkat dipinjam | **P1** |
| 6 | Audit trail dapat diubah/dihapus dari perangkat | Bukti audit tidak sah untuk pemeriksaan | **P1** |
| 7 | Modul kelas 2,6 MB dalam satu potongan | Halaman kelas lambat pada jaringan sekolah | **P1** |
| 8 | Dataset Dapodik (258 KB sumber) ikut bundel utama | Bundel awal membengkak, padahal data jarang berubah | **P2** |
| 9 | Penulisan koleksi penuh per mutasi | UI tersendat pada data besar; risiko kuota penuh | **P2** |
| 10 | Tanpa tes otomatis | Refactor mahal dan berisiko | **P2** |

---

## 5. Proposal Pengembangan (Bertahap)

### Fase 0 — Penanganan darurat (±3–5 hari)
- Hapus jalur PIN default; PIN wajib diatur saat instalasi dan disimpan sebagai hash.
- Tambahkan kata sandi pada `/api/ai/*` (kunci internal per instalasi) dan batas kuota harian.
- Pencadangan otomatis harian ke berkas (unduhan/Drive) + tombol "pulihkan".
- Nonaktifkan penyimpanan token OAuth di `localStorage`; gunakan sesi di server.

**Kriteria terima:** PIN default ditolak; endpoint AI menolak permintaan tanpa kredensial; backup harian terbukti dapat dipulihkan.

### Fase 1 — Fondasi data & identitas (±3–4 minggu)
- Basis data server: **PostgreSQL + Prisma**, migrasi bertahap per koleksi (mulai dari barang masuk/keluar, aset, opname, ledger).
- API REST/JSON dengan skema tervalidasi (Zod), paginasi, filter, dan otorisasi per-peran di setiap endpoint.
- Autentikasi server: sesi httpOnly + kata sandi Argon2id, RBAC (admin, bendahara, sarpras, guru, siswa, orang tua), audit log **append-only**.
- Lapisan klien: `localStorageService` dipertahankan sebagai cache baca (IndexedDB) dan antrean offline, bukan sumber kebenaran.
- Impor Dapodik/pegawai lewat API (CSV/Excel), bukan data tertanam.

**Kriteria terima:** dua perangkat menampilkan data yang sama; transaksi tercatat dengan identitas pengguna; peran tanpa hak mendapat 403.

### Fase 2 — Efisiensi & kecepatan (±2–3 minggu)
Rincian target ada di Bagian 6.

**Kriteria terima:** JS awal ≤ 200 KB gzip; masuk modul kelas ≤ 100 KB gzip awal; LCP p75 < 2,5 s pada 4G; waktu simpan transaksi < 150 ms.

### Fase 3 — Modularisasi & modul akademik (±3–4 minggu)
- Pecah `ClassroomApp.tsx` (17.722 baris) menjadi rute per-fitur dengan pemuatan malas.
- Pindahkan data kelas (40 kunci penyimpanan) ke server; portal orang tua memakai API.
- Tambah dukungan tahun ajaran/rombel (rollover), dan ekspor rapor.

**Kriteria terima:** setiap layar kelas dimuat < 500 ms setelah klik pertama; data kelas konsisten lintas pengguna.

### Fase 4 — AI, analitik, dan integrasi (±2–3 minggu)
- Respons AI *streaming* (SSE), cache hasil, kuota per pengguna, pilihan model hemat biaya.
- Laporan terjadwal (harian/bulanan) dijalankan di server, bukan di browser yang harus terbuka.
- Integrasi resmi Dapodik/ARKAS (impor/ekspor format), e-signature.

**Kriteria terima:** token pertama AI < 1,5 s; laporan terjadwal terkirim tanpa membuka aplikasi.

### Fase 5 — Mutu & keberlanjutan (±2 minggu)
- Unit test (Vitest) untuk service & perhitungan (stok, penyusutan, nilai), E2E (Playwright) untuk alur kritis.
- CI (lint + typecheck + test + build) dan dokumentasi arsitektur.

**Kriteria terima:** alur kritis (login, barang masuk/keluar, opname, nilai) tercakup tes otomatis.

---

## 6. Upgrade Efisiensi & Kecepatan

### 6.1 Ringkasan dampak yang diharapkan

| # | Tindakan | Kondisi sekarang | Target |
|---|---|---|---|
| 1 | Pecah `ClassroomApp` per fitur + pemuatan malas | 2.639 kB (412 kB gzip) sekali unduh | < 300 kB, awal ±100 kB gzip |
| 2 | Keluarkan dataset Dapodik/pegawai dari bundel; layani lewat API + cache | ±258 kB sumber di bundel utama | entry turun ±150–200 kB |
| 3 | Pemuatan malas untuk `xlsx` (425 kB), `jspdf` (626 kB), `firebase` (556 kB) — muat saat dipakai | Sebagian sudah dipisah chunk, tetapi ikut terunduh pada alur tertentu | hemat ±500 kB–1 MB per sesi biasa |
| 4 | Kurangi CSS | 360 kB | ±120 kB |
| 5 | Ganti `localStorage` → IndexedDB + store dengan indeks | Tulis ulang koleksi penuh, sinkron, batas 5–10 MB | tulis < 10 ms, kapasitas ratusan MB |
| 6 | Virtualisasi tabel (742 siswa, ribuan baris ledger) | Render seluruh baris | hanya ±30 baris di DOM |
| 7 | Pindahkan PDF/QR massal/penyusutan ke Web Worker | Memblokir UI saat ekspor | UI tetap responsif |
| 8 | Cache hasil AI + *streaming* + kuota | Tanpa streaming; cache hanya 1 endpoint | token pertama < 1,5 s |
| 9 | Sajikan build produksi dengan kompresi + cache immutable | Mode dev (Vite middleware) | aset `.js` di-cache 1 tahun |

### 6.2 Penjelasan teknis singkat

- **Pemecahan bundel.** `ClassroomApp` adalah satu komponen monolitik 17,7 ribu baris; seluruh modul kelas (CBT, P5, forum, peer review, analitik) ikut terunduh meski pengguna hanya membuka jadwal. Rute per-fitur dengan `React.lazy` memotong beban awal lebih dari 90%.
- **Dataset di dalam kode.** 742 siswa, data sekolah, dan data resmi lain ditanam sebagai berkas TypeScript (±258 KB sumber) lalu ikut bundel serta disalin ke `localStorage` pada setiap perangkat. Data ini seharusnya berasal dari API dan di-cache.
- **Pola tulis.** Setiap perubahan menulis ulang satu koleksi penuh secara sinkron (`BB_ACCOUNTS` saja 214 KB). Dengan 742 siswa dan ribuan transaksi, ini memblokir main thread. IndexedDB asinkron + penulisan per-record menghilangkan masalah ini.
- **IndexedDB untuk berkas.** Media/dokumen saat ini berupa base64 di penyimpanan yang berkuota kecil; simpan sebagai blob di IndexedDB atau objek storage di server.
- **Render.** 593 `useState` dan 121 `useEffect` tersebar di 158 berkas; menambahkan store kecil (mis. Zustand) dengan selektor ter-memo dan `useDeferredValue` pada pencarian akan memangkas render berulang pada daftar besar.
- **Server AI.** Tambahkan autentikasi, kuota, cache berbasis hash permintaan, dan *streaming*; guard 50 MB tetap dipertahankan hanya untuk endpoint pemindaian dokumen.
- **Build & pengiriman.** Untuk produksi gunakan `vite build` + `express.static` dengan `compression` (brotli/gzip), `Cache-Control: immutable` untuk aset ber-hash, dan `modulepreload` untuk chunk kritis.
- **Pengalaman pengembang.** `vite.config.ts` mematikan HMR (`hmr: false`); mengaktifkannya kembali mempercepat siklus perubahan tanpa memengaruhi produksi.

---

## 7. Arsitektur Target

```
Browser (React SPA + PWA)
  ├─ Cache baca: IndexedDB (data + media)  ←→  Antrean offline
  └─ API client (sesi httpOnly)
        │
        ▼
Express / Node (server.ts dipecah per rute)
  ├─ Autentikasi & RBAC (sesi, Argon2id)
  ├─ REST API tervalidasi (Zod) + paginasi
  ├─ Layanan AI (streaming, cache, kuota)
  ├─ Penjadwal laporan (cron job)
  └─ PostgreSQL (Prisma) + penyimpanan objek (dokumen/gambar)
        ├─ Audit log append-only
        └─ Backup harian terverifikasi
Integrasi: Dapodik (impor), ARKAS/SPJ (ekspor), Google Workspace (opsional)
```

---

## 8. Rencana Kerja & Estimasi

| Fase | Fokus | Estimasi (orang-hari) | Hasil utama |
|---|---|---|---|
| 0 | Keamanan & backup darurat | 4–6 | PIN default hilang, endpoint terlindungi, backup harian |
| 1 | Data & identitas di server | 18–26 | PostgreSQL, API, RBAC, audit append-only |
| 2 | Performa & bundel | 10–15 | JS awal ≤ 200 kB gzip, LCP < 2,5 s |
| 3 | Modularisasi & akademik | 18–26 | Kelas terpecah, data kelas di server |
| 4 | AI, analitik, integrasi | 12–18 | Streaming AI, laporan terjadwal, ekspor resmi |
| 5 | Mutu & CI | 8–12 | Tes unit/E2E, pipeline CI |
| **Total** | | **70–103 orang-hari** (±14–20 minggu untuk 1 pengembang; ±8–10 minggu untuk 2) | |

**Quick win 1 minggu** (bila anggaran terbatas): butir 1, 3, dan 5 pada Bagian 6.1 plus Fase 0 — dampak terasa paling besar dengan risiko paling kecil.

---

## 9. Indikator Keberhasilan (KPI)

| KPI | Sekarang | Target |
|---|---|---|
| JS awal (gzip) | ±291 kB | ≤ 200 kB |
| Masuk modul kelas (gzip) | ±412 kB | ≤ 100 kB |
| LCP p75 (4G) | belum terukur di produksi | < 2,5 s |
| Konsistensi data antar perangkat | 0% (per-browser) | 100% |
| Kehilangan data saat cache dibersihkan | total | 0 (server + backup) |
| Waktu simpan transaksi | penulisan koleksi penuh | < 150 ms |
| Cakupan tes alur kritis | 0 | ≥ 80% |
| Token pertama respons AI | menunggu respons penuh | < 1,5 s |

---

## 10. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Migrasi data dari perangkat pengguna | Data lama bisa hilang | Alat impor dari ekspor `localStorage`/berkas backup, uji pada data salinan |
| Perubahan besar pada berkas monolitik | Regresi fitur | Modularisasi bertahap + tes E2E sebelum memindahkan modul |
| Ketergantungan layanan AI eksternal | Biaya & kuota | Cache, kuota per pengguna, fallback heuristik yang sudah ada |
| Infrastruktur sekolah (listrik/jaringan) | Sinkronisasi terputus | Antrean offline di IndexedDB + indikator sinkronisasi |
| Kepatuhan data siswa | Data pribadi anak | RBAC ketat, masking (sudah ada), audit akses, retensi terbatas |

---

## 11. Lampiran

### Berkas terbesar (kandidat refactor)
`ClassroomApp.tsx` (17.722), `pdfService.ts` (4.694), `classroomService.ts` (4.323), `QRScannerModal.tsx` (3.836), `ScanSettingsModal.tsx` (3.330), `DashboardAnalitikGuru.tsx` (3.217), `localStorageService.ts` (2.741), `AdminPanel.tsx` (1.876), `BeritaAcaraPreviewModal.tsx` (1.822).

### Endpoint server
`GET /api/health`, `POST /api/ai/scan-receipt`, `POST /api/ai/predict-procurement`, `POST /api/ai/grounded-explorer`, `POST /api/ai/assistant`, `POST /api/ai/draft-berita-acara`, `POST /api/ai/analyze-student-trends`, `POST /api/ai/peer-review-suggestions`, `POST /api/reports/send-daily-scan-report`.

### Cara mengukur ulang
```bash
# ukuran build produksi
npx vite build --outDir /tmp/dist

# pemeriksaan tipe
npm run lint
```
