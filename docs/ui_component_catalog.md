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

### F. `ForcePassword` (`client/src/components/ForcePassword.jsx`)
Modal wajib ganti kata sandi pada login pertama (`mustChangePassword === true`) atau setelah reset sandi oleh Admin Perusahaan:
* Menutup layar belakang dengan efek *backdrop blur* (`fixed inset-0 z-50 bg-foreground/80 backdrop-blur-sm`) dan kartu berbayang neon (`shadow-[8px_8px_0_0_#c9f23c]`).
* Memvalidasi kata sandi baru minimal 8 karakter kombinasi huruf dan angka serta tidak boleh sama dengan kata sandi awal.

---

## 4. Spesifikasi Halaman Modul Admin Perusahaan / HRD (`client/src/pages/admin/`)

### A. `AdminDashboard` (`client/src/pages/admin/AdminDashboard.jsx`)
Dasbor analitik operasional HRD:
* **4 Kartu KPI Harian:** `% Hadir hari ini`, `Tepat waktu`, `Terlambat`, dan `Jurnal menunggu` (navigasi cepat ke menu Jurnal).
* **Grafik Tren Kehadiran 14 Hari Kerja:** Grafik batang bertumpuk (*stacked bar*: tepat waktu, terlambat, tidak hadir) + garis putus-putus persentase kehadiran dengan *hover tooltip*.
* **Peringkat Performa 30 Hari:** Peringkat karyawan dengan pengalih urutan `Kehadiran` / `Ketepatan`, ikon trofi, dan bilah progres.
* **Panel Perlu Perhatian & Lisensi:** Daftar jurnal menunggu verifikasi, peringatan keterlambatan/kehadiran rendah, serta ringkasan lisensi perusahaan.

### B. `AdminKaryawan` (`client/src/pages/admin/AdminKaryawan.jsx`)
Manajemen akun dan direktori karyawan:
* **Bar Kuota Lisensi:** Indikator kursi aktif terpakai terhadap batas `maxUsers` perusahaan.
* **Pencarian & Filter Status:** Pencarian nama/NIK/jabatan serta filter `Semua`, `Aktif`, `Wajib ganti sandi`, dan `Nonaktif`.
* **Form Tambah Karyawan & Kartu Kredensial Awal:** Pendaftaran karyawan baru dengan pembuatan kata sandi sementara otomatis (`Hdr-XXXXX`) yang dapat disalin.
* **Slide-Over Detail & Tindakan Akun:** Panel geser riwayat 30 hari & 10 presensi terakhir, modal konfirmasi `Reset sandi`, serta `Nonaktifkan` / `Aktifkan`.

### C. `AdminRekap` (`client/src/pages/admin/AdminRekap.jsx`)
Rekapitulasi kehadiran dan jejak audit (*audit trail*):
* **Tab Presensi:** Filter rentang tanggal (`Dari` – `Sampai`), filter karyawan, filter status, tombol `Ekspor XLSX` (unduh CSV) & `Ekspor PDF` (dokumen cetak resmi), serta modal peninjau bukti foto swafoto (`PhotoModal`).
* **Tab Audit Trail:** Tabel log aktivitas sensitif bersifat *append-only* (`at`, `actor`, `action`, `detail`).

### D. `AdminJurnal` (`client/src/pages/admin/AdminJurnal.jsx`)
Verifikasi dan evaluasi jurnal kerja harian karyawan:
* **Filter Status & Karyawan:** Tab `Menunggu`, `Disetujui`, `Ditolak`, dan `Semua` dengan lencana jumlah jurnal serta *dropdown* karyawan.
* **Persetujuan Massal (`Bulk Approve`):** Tombol `Setujui semua yang tampil (N)` dengan dialog konfirmasi.
* **Form Evaluasi Kartu Jurnal:** Tombol `Setujui` dan `Tolak` dengan input catatan evaluasi HRD (wajib minimal 5 karakter saat menolak jurnal).

### E. `AdminLayarQR` (`client/src/pages/admin/AdminLayarQR.jsx`)
Layar kiosk QR dinamis kantor untuk pencegahan titip absen:
* **QR Code & Kode 6 Digit Berputar (15 Detik):** Matriks SVG QR deterministik berbasis `qrSecret` tenant dan jendela waktu 15 detik, dilengkapi cincin progres hitung mundur dan mode `Layar penuh` (*Fullscreen API*).
* **Panel Kehadiran Hari Ini & Panduan 3 Lapis Keamanan:** Menampilkan jumlah karyawan hadir hari ini serta penjelasan mekanisme *rolling token*.

### F. `AdminTalenta` (`client/src/pages/admin/AdminTalenta.jsx`)
Pencarian rekam jejak kandidat lintas perusahaan sesuai UU PDP:
* **Stepper 3 Langkah:** `1. Cari NIK` -> `2. Izin karyawan` -> `3. Lihat performa`.
* **Identitas Tersamar & Opt-In Consent:** Menampilkan nama tersamar (`B••• S••••••`) sebelum kandidat menyetujui permintaan akses, dan membuka *timeline* kehadiran lintas perusahaan setelah berstatus `APPROVED`.

### G. `AdminPengaturan` (`client/src/pages/admin/AdminPengaturan.jsx`)
Pengaturan titik kantor, geofence, jaringan, dan jam kerja:
* **Lokasi & Visualisasi Radius Geofence (`RadiusViz`):** Input alamat, koordinat *latitude/longitude*, tombol geolokasi browser `Gunakan lokasi saya saat ini`, dan *slider* radius `20 m`–`200 m` dengan diagram skala interaktif.
* **Jaringan & Jam Kerja:** Pengaturan awalan IP Wi-Fi kantor (`ipPrefix`), jam masuk (`workStart`), jam pulang (`workEnd`), dan toleransi keterlambatan (`graceMin`).

---

## 5. Spesifikasi Halaman Modul Super Admin Platform (`client/src/pages/super/`)

### A. `SuperDashboard` (`client/src/pages/super/SuperDashboard.jsx`)
Konsol pemantauan tingkat platform (tanpa mengekspos data pribadi karyawan):
* **5 Kartu KPI Platform:** `Tenant aktif`, `Lisensi kedaluwarsa`, `Ditangguhkan`, `Pengguna / kuota`, dan `Presensi hari ini` (agregat lintas tenant).
* **Panel Perpanjangan Lisensi & Grafik Kapasitas:** Daftar tenant yang lisensinya kedaluwarsa atau berakhir $\le 60$ hari dengan tombol cepat `+12 bulan`, serta grafik batang bertumpuk horizontal penggunaan kuota per kode perusahaan.
* **Monitor Isolasi Basis Data & Audit Integritas:** Tabel jumlah baris per `tenant_id`, 4 indikator pemeriksaan integritas isolasi multi-tenant secara *real-time*, kartu SQL *Middleware tenant*, dan tabel referensi skema PRD.

### B. `SuperTenant` (`client/src/pages/super/SuperTenant.jsx`)
Manajemen *tenant* B2B dan siklus hidup lisensi:
* **Form Provisioning Tenant Baru:** Pendaftaran perusahaan klien baru beserta akun Admin pertama dan pembuatan kunci lisensi unik (`HDR-XXXX-XXXX-XXXX`).
* **Kartu Serah Terima (`HandoffCard`):** Menampilkan kode perusahaan, kunci lisensi, NIK admin, dan kata sandi awal sementara dengan tombol salin cepat.
* **Kartu Tenant (`TenantCard`):** Menampilkan detail lisensi, pemilih durasi perpanjangan (`3`, `6`, `12` bulan), serta tombol `Tangguhkan` / `Aktifkan` akses tenant.
