# Dokumentasi Aturan Validasi Formulir Klien (Client Form Validation Rules)

Dokumen ini mendefinisikan parameter validasi input pengguna di sisi klien (*client-side validation*) menggunakan pustaka **Zod** pada antarmuka autentikasi platform **HadirIn B2B Multi-Tenant**.

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

## 3. Kebijakan Registrasi (Registration Policy)
Sesuai PRD v1.0 Multi-Tenant B2B:
* **Admin-Provisioned (No Self-Registration):** Pendaftaran mandiri publik dihilangkan sepenuhnya. Akun pekerja didaftarkan secara terpusat oleh Admin Perusahaan masing-masing.
