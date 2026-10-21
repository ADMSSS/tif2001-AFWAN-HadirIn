# Dokumentasi Aturan Validasi Formulir Klien (Client Form Validation Rules)

Dokumen ini mendefinisikan parameter validasi input pengguna di sisi klien (*client-side validation*) menggunakan pustaka **Zod** pada antarmuka autentikasi platform **HadirIn B2B Multi-Tenant**.

---

## 1. Skema Formulir Masuk Karyawan & Admin Perusahaan (`tenantLoginSchema`)

File referensi: `client/src/pages/AuthPage.jsx`

| Field | Tipe Data | Aturan Validasi | Pesan Galat (Error Message) |
| :--- | :--- | :--- | :--- |
| `companyCode` | String | Wajib, min. 2, maks. 10 karakter | - "Kode perusahaan wajib diisi"<br>- "Kode perusahaan minimal 2 karakter"<br>- "Kode perusahaan maksimal 10 karakter" |
| `nik` | String | Wajib, min. 4 digit | - "NIK / ID Karyawan wajib diisi"<br>- "NIK minimal 4 digit karakter" |
| `password` | String | Wajib, min. 6 karakter | - "Kata sandi wajib diisi"<br>- "Kata sandi minimal 6 karakter" |

*Catatan: Nilai `companyCode` otomatis dikonversi menjadi huruf kapital (uppercase) secara real-time.*

---

## 2. Skema Formulir Masuk Super Admin Platform (`superAdminLoginSchema`)

File referensi: `client/src/pages/AuthPage.jsx`

| Field | Tipe Data | Aturan Validasi | Pesan Galat (Error Message) |
| :--- | :--- | :--- | :--- |
| `email` | String | Wajib, format email valid | - "Email Super Admin wajib diisi"<br>- "Format email tidak valid" |
| `password` | String | Wajib, min. 6 karakter | - "Kata sandi wajib diisi"<br>- "Kata sandi minimal 6 karakter" |

---

## 3. Kebijakan Registrasi (Registration Policy)
Sesuai PRD v1.0 Multi-Tenant B2B:
* **Admin-Provisioned (No Self-Registration):** Pendaftaran mandiri publik telah dieliminasi total guna mencegah akses tidak sah dan menjaga integritas isolasi data antar-perusahaan.
* Pembuatan akun karyawan dan penetapan kata sandi awal dilakukan secara terpusat oleh Admin Perusahaan masing-masing.

---

## 4. Strategi Umpan Balik Antarmuka (UI Feedback)
1. **Dynamic Error Clearing:** Pesan error di bawah kolom input akan otomatis hilang saat pengguna mengetik ulang.
2. **Visual Focus State:** Kolom input yang aktif diberi aksen border dan shadow bernuansa neon lime (`#ccff00`) sesuai prototipe Figma.
3. **Password Visibility Toggle:** Tombol intip kata sandi (ikon mata) untuk melihat atau menyembunyikan karakter kata sandi.