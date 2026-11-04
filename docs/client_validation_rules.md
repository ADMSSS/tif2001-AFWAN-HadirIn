# Dokumentasi Aturan Validasi Formulir & Bisnis Klien (Client Validation Rules)

Dokumen ini mendefinisikan aturan validasi input pengguna dan aturan bisnis di sisi klien (*client-side validation*) pada platform **HadirIn B2B Multi-Tenant**.

---

## 1. Skema Formulir Masuk Perusahaan — Pekerja & Admin Perusahaan (`tenantLoginSchema`)

File referensi: `client/src/pages/AuthPage.jsx`

| Field | Tipe Data | Aturan Validasi | Pesan Galat (Error Message) |
| :--- | :--- | :--- | :--- |
| `companyCode` | String | Wajib, min. 2, maks. 10 karakter | - "Kode perusahaan wajib diisi"<br>- "Kode perusahaan minimal 2 karakter"<br>- "Kode perusahaan maksimal 10 karakter" |
| `nik` | String | Wajib, numerik, tepat 16 digit | - "NIK wajib diisi"<br>- "NIK hanya boleh berisi angka"<br>- "NIK harus terdiri dari 16 digit angka" |
| `password` | String | Wajib, min. 6 karakter | - "Kata sandi wajib diisi"<br>- "Kata sandi minimal 6 karakter" |

*Catatan: Nilai `companyCode` otomatis dikonversi menjadi huruf kapital (uppercase), dan `nik` otomatis memfilter karakter non-angka maksimal 16 digit.*

---

## 2. Skema Formulir Konsol Super Admin (`superAdminLoginSchema`)

File referensi: `client/src/pages/AuthPage.jsx`

| Field | Tipe Data | Aturan Validasi | Pesan Galat (Error Message) |
| :--- | :--- | :--- | :--- |
| `username` | String | Wajib, min. 3 karakter | - "Username Super Admin wajib diisi"<br>- "Username minimal 3 karakter" |
| `password` | String | Wajib, min. 6 karakter | - "Kata sandi wajib diisi"<br>- "Kata sandi minimal 6 karakter" |

---

## 3. Aturan Validasi Presensi Geofence & Kamera (`PresensiFlow` & `geo.js`)

File referensi: `client/src/utils/geo.js`, `client/src/pages/employee/PresensiFlow.jsx`, `client/src/store/appStore.jsx`

| Parameter / Aturan | Spesifikasi Validasi | Perilaku UI / Pesan Validasi |
| :--- | :--- | :--- |
| **Jarak Geofence (`distanceM`)** | `distanceM <= office.radiusM` (mis. `<= 50 m`) | Jika di luar batas: Status menjadi **Diluar Radius** (merah `#d93a15`), menampilkan *"Geofence kantor: [X] m dari titik kantor (batas [Y] m)"*, dan tombol presensi dinonaktifkan. |
| **Akurasi Sinyal GPS (`accuracyM`)** | `accuracyM <= 100 m` (`MAX_ACCURACY_M`) | Jika sinyal lemah (`> 100 m`): Menampilkan peringatan *"Akurasi GPS terlalu rendah (±[X] m, maks ±100 m)"*. |
| **Prasyarat Presensi Masuk (`canCheckIn`)** | Belum melakukan presensi masuk pada tanggal berjalan | Jika sudah presensi masuk: Menampilkan *"Sudah presensi masuk hari ini"*. |
| **Prasyarat Presensi Pulang (`canCheckOut`)** | Sudah presensi masuk, waktu `>= workEnd` (`17:00`), dan **wajib sudah mengisi minimal 1 jurnal hari ini** | - Sebelum jam pulang: *"Check-out dibuka mulai pukul 17:00"*<br>- Jurnal belum diisi: *"Isi minimal 1 jurnal kerja hari ini sebelum presensi pulang"* |

---

## 4. Aturan Validasi Formulir Jurnal Kerja Harian (`EmployeeJurnal`)

File referensi: `client/src/pages/employee/EmployeeJurnal.jsx`

| Field | Tipe Data | Aturan Validasi | Pesan Galat / Perilaku |
| :--- | :--- | :--- | :--- |
| `Prasyarat Kehadiran` | Boolean | Karyawan wajib sudah presensi masuk hari ini (`canWriteToday`) | Input dan tombol `Kirim jurnal` dinonaktifkan dengan pesan *"Anda harus presensi masuk terlebih dahulu untuk mengisi jurnal hari ini."* |
| `title` (`Judul Tugas`) | String | Wajib (`trim().length > 0`) | "Judul dan uraian capaian wajib diisi." |
| `body` (`Uraian Capaian`) | String | Wajib (`trim().length > 0`) | "Judul dan uraian capaian wajib diisi." |
| `durationMin` (`Estimasi Waktu`) | Number | Pilihan: `30`, `60`, `90`, `120`, `180`, `240` menit | Default `60` menit |
| `completion` (`Status Penyelesaian`) | Enum | Pilihan: `'done'` (`Selesai`), `'progress'` (`Berjalan`), `'pending'` (`Tertunda`) | Default `'done'` (`Selesai`) |

---

## 5. Aturan Validasi Ganti Kata Sandi & Persetujuan UU PDP (`EmployeeProfil`)

File referensi: `client/src/pages/employee/EmployeeProfil.jsx`

| Field | Tipe Data | Aturan Validasi | Pesan Galat (Error Message) |
| :--- | :--- | :--- | :--- |
| `oldPw` (`Sandi Lama`) | String | Wajib diisi | "Semua kolom sandi wajib diisi." |
| `newPw` (`Sandi Baru`) | String | Wajib, minimal 8 karakter, wajib mengandung kombinasi huruf (`/[A-Za-z]/`) dan angka (`/\d/`) | - "Sandi baru minimal 8 karakter."<br>- "Sandi baru harus kombinasi huruf dan angka." |
| `confirmPw` (`Ulangi Sandi Baru`) | String | Wajib sama persis dengan `newPw` | "Konfirmasi sandi baru tidak cocok." |
| `Persetujuan UU PDP` | Enum | Hanya permintaan berstatus `'pending'` yang dapat diubah menjadi `'approved'` atau `'rejected'` | Keputusan dicatat beserta cap waktu (`decidedAt`) dan tidak dapat diubah kembali tanpa permintaan baru. |

---

## 6. Kebijakan Registrasi (Registration Policy)
Sesuai PRD v1.0 Multi-Tenant B2B:
* **Admin-Provisioned (No Self-Registration):** Pendaftaran mandiri publik dihilangkan sepenuhnya. Akun pekerja didaftarkan secara terpusat oleh Admin Perusahaan masing-masing.
