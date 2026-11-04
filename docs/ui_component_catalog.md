# Katalog Komponen UI HadirIn B2B Multi-Tenant (UI Component Catalog)

Dokumentasi spesifikasi antarmuka dan komponen modular untuk platform **HadirIn B2B Multi-Tenant** (Modul Autentikasi & Modul Karyawan: Dasbor, Presensi Geofence/Kamera, Jurnal Kerja Harian, dan Profil UU PDP) berdasarkan rancangan Figma Make (`figma desain/`) 1:1 tanpa kotak/panel demo.

---

## 1. Panduan Palet Warna & Tipografi (1:1 Figma Design Tokens)

* **Primary Accent (`--accent`):** Neon Lime (`#c9f23c`)
* **Foreground / Dark (`--foreground`):** Deep Charcoal Black (`#111611`)
* **Main Background (`--background`):** Warm Sand (`#efece1`) / Auth Section (`#ffffff`)
* **Card / Input Surface (`--card`):** Warm Off-White (`#f9f7ef`)
* **Muted Foreground (`--muted-foreground`):** Olive-Gray (`#565a4d`)
* **Destructive (`--destructive`):** Vermilion Red (`#d93a15`)
* **Typography (`@theme inline`):**
  * Display & Wordmark (`--font-display`): `Bricolage Grotesque`, sans-serif
  * Body Text (`--font-sans`): `Instrument Sans`, sans-serif
  * Form Label & Monospace (`--font-mono`): `DM Mono`, monospace

---

## 2. Komponen Primitif & Layout (`client/src/components/`)

### A. `ui.jsx` (`client/src/components/ui.jsx`)
Pustaka komponen UI dasar bergaya *Neo-Brutalist Swiss Grid*:
* **`Wordmark`**: Logo identitas `Hadir` + kotak `In` (`bg-foreground text-accent` atau terbalik pada latar gelap).
* **`PageHead`**: Header halaman dengan *eyebrow* monospasi, judul utama `font-display font-extrabold`, subjudul, dan slot aksi kanan.
* **`Panel`**: Kartu kontainer berbingkai `border-2 border-foreground rounded-md` dengan varian `card`, `paper`, `dark`, `accent`, dan `muted`.
* **`Stat`**: Kartu metrik KPI dengan label monospasi, angka besar `font-display`, subteks, dan varian warna (`default`, `accent`, `dark`, `danger`).
* **`Pill`**: Lencana status monospasi (`default`, `accent`, `dark`, `danger`, `warn`, `success`, `outline`).
* **`Btn`**: Tombol aksi dengan bayangan keras (`shadow-[3px_3px_0_0_#111611]`) dan varian `primary`, `accent`, `secondary`, `ghost`, serta `danger`.
* **`Field`**: Pembungkus input dengan label monospasi kapital, teks bantuan (`hint`), dan pesan galat (`error`).
* **`Avatar`**: Inisial nama pengguna dalam lingkaran berbingkai `border-2 border-foreground`.
* **`Empty`**: Tampilan status kosong (*empty state*) dengan bingkai putus-putus (`border-dashed`).
* **`Meter`**: Indikator bilah progres persentase kehadiran (`0%`–`100%`).

### B. `InputText` (`client/src/components/InputText.jsx`) & `PrimaryButton` (`client/src/components/PrimaryButton.jsx`)
Komponen input dan tombol utama pada halaman autentikasi yang proporsional dalam satu *viewport* desktop (`100vh`) tanpa *scrolling*.

### C. `Shell` (`client/src/components/Shell.jsx`)
Kerangka navigasi utama aplikasi:
* **Sidebar Kiri (Desktop) & Bottom Bar (Mobile):** Menampilkan `Wordmark`, kartu identitas Tenant (`TENANT · NLG — PT Nusantara Logistik`), menu navigasi (`Dasbor`, `Presensi`, `Jurnal`, `Profil`), serta profil pengguna aktif dan tombol `Keluar`.
* **Top Bar:** Menampilkan tanggal aktif dalam Bahasa Indonesia, jam kerja perusahaan (`08:00 – 17:00`), dan jam digital *real-time* (`HH:MM:SS`).

---

## 3. Spesifikasi Halaman Modul Autentikasi & Karyawan (`client/src/pages/`)

### A. `AuthPage` (`client/src/pages/AuthPage.jsx`)
Halaman autentikasi dua mode dengan struktur 1:1 sesuai Figma:
1. **Header Banner Atas (`bg-accent text-foreground`):**
   * `Wordmark` di pojok kiri atas (`lg:top-5 lg:left-8`) dan headline dua baris *"Hadir di kantor, / bukan di **peta palsu.**"* (`lg:mt-4` di desktop agar proporsional dengan logo).
2. **Mode Login Perusahaan (Karyawan & Admin Perusahaan):**
   * Seluruh input (`Kode perusahaan`, `NIK` 16 digit, `Kata sandi`) dan tombol `Masuk` muat penuh dalam 1 layar desktop tanpa *scrolling*.
   * Tautan pengalih `Masuk sebagai Super Admin platform` berada di bagian bawah halaman.
3. **Mode Konsol Super Admin:**
   * Form login khusus pengelola platform (`Username` dan `Kata sandi`) dengan tautan kembali ke login perusahaan.

### B. `EmployeeDashboard` (`client/src/pages/employee/EmployeeDashboard.jsx`)
Dasbor utama karyawan yang adaptif terhadap waktu dan status kerja:
* **Sapaan Dinamis:** Membaca waktu dan nama depan pengguna yang sedang login (`Selamat pagi/siang/sore/malam, [Nama User]`).
* **Banner Peringatan Jurnal Wajib (Sore Hari):** Menampilkan banner hijau limau (`Jurnal hari ini belum diisi — Isi jurnal ->`) apabila karyawan sudah presensi masuk namun belum mengisi jurnal kerja harian.
* **Kartu Status Hari Ini:**
  * Pagi (belum check-in): `Anda belum presensi` + tombol `Mulai presensi masuk`.
  * Siang/Sore (sudah check-in, `< 17:00`): `Bekerja sejak 08:01`, durasi kerja berjalan, dan lencana `TEPAT WAKTU` / `TERLAMBAT`.
  * Waktu Pulang (`>= 17:00`): `Waktunya presensi pulang` — tombol `Mulai presensi pulang` terkunci otomatis jika jurnal hari ini belum dikirim.
* **Statistik Bulan Berjalan & Kalender 30 Hari Terakhir:** Menampilkan `% Kehadiran`, `% Tepat Waktu`, `Total Jam`, `Jurnal Disetujui`, serta matriks kalender 30 hari terakhir dan panel informasi perusahaan (`Tempat kerja` & `Bergabung`).

### C. `EmployeePresensi` & `PresensiFlow` (`client/src/pages/employee/EmployeePresensi.jsx`, `client/src/pages/employee/PresensiFlow.jsx`)
Modul verifikasi kehadiran dua langkah (*Anti-Spoofing Geofence & WebRTC Camera*) beserta bukti struk digital:
* **Langkah 1 — Verifikasi Lokasi (Radar Geofence):**
  * Menghitung jarak koordinat GPS pengguna ke titik kantor menggunakan rumus *Haversine* (`client/src/utils/geo.js`).
  * **Status `Di Dalam Radius Kantor` (mis. `11 m` dari batas `50 m`):** Header kartu berwarna hijau limau (`bg-accent`), titik pengguna berada di dalam lingkaran kantor, dan tombol `Mulai Absen Masuk/Pulang` aktif.
  * **Status `Diluar Radius` (mis. `477 m` dari batas `50 m`):** Header kartu berwarna merah (`bg-destructive text-white`), titik oranye `ANDA` berada di luar lingkaran kantor dengan garis putus-putus, kotak peringatan detail jarak, dan tombol presensi dinonaktifkan.
* **Langkah 2 — Verifikasi Wajah (WebRTC Camera Modal):**
  * Mengakses kamera depan (`navigator.mediaDevices.getUserMedia`) dengan panduan bingkai wajah berbentuk **oval vertikal besar** (`w-64 h-80 sm:w-72 sm:h-96 rounded-[50%]`) bertuliskan `WAJAH DI SINI` serta perekaman cap waktu, koordinat GPS, dan nama perusahaan pada hasil tangkapan kanvas.
* **Bukti Presensi (`ReceiptModal`) & Arsip Riwayat:** Menampilkan struk bukti kehadiran lengkap (foto swafoto, waktu masuk/pulang, selisih menit, koordinat GPS, jarak meter) dan tabel arsip riwayat presensi.

### D. `EmployeeJurnal` (`client/src/pages/employee/EmployeeJurnal.jsx`)
Modul pencatatan dan pemantauan jurnal kerja harian:
* **Formulir Jurnal Baru / Revisi (Kolom Kiri):** Input `Judul Tugas`, `Uraian Capaian`, `Estimasi Waktu (menit)`, dan pemilih `Status Penyelesaian` (`Selesai` | `Berjalan` | `Tertunda`). Terkunci jika karyawan belum melakukan presensi masuk hari ini.
* **Daftar & Filter Jurnal (Kolom Kanan):** Tab filter status (`Semua`, `Menunggu`, `Disetujui`, `Ditolak`), pengelompokan berdasarkan tanggal kerja beserta total durasi harian, lencana `Terkunci` untuk jurnal yang telah disetujui, serta kotak `CATATAN ADMIN` dan tombol `Revisi & kirim ulang` jika jurnal ditolak.

### E. `EmployeeProfil` (`client/src/pages/employee/EmployeeProfil.jsx`)
Modul identitas pekerja, rekam jejak lintas perusahaan, keamanan akun, dan kepatuhan UU PDP:
* **Kartu Identitas Pekerja:** Menampilkan `Avatar`, nama lengkap, jabatan, nama & kode perusahaan, tanggal bergabung, serta **NIK 16 digit tersembunyi** (`3173••••••••0002`) dengan tombol ikon mata untuk menampilkan/menyembunyikan NIK penuh.
* **Rekam Jejak Karier Lintas Perusahaan (NIK Sama):** Menampilkan riwayat penempatan perusahaan beserta lencana `AKTIF` / `SELESAI` dan bilah progres persentase kehadiran (`Meter`).
* **Keamanan (`Ganti sandi`):** Formulir pembaruan kata sandi (`Sandi lama`, `Sandi baru` min. 8 karakter kombinasi huruf & angka, dan `Ulangi sandi baru`).
* **Riwayat Keputusan Persetujuan Akses (`UU PDP`):** Menampilkan daftar permintaan akses ringkasan kehadiran dari perusahaan lain dengan tombol `Setujui` / `Tolak` atau tampilan `Belum ada permintaan`.
