# Dokumentasi Aturan Validasi Formulir Klien (Client Form Validation Rules)

Dokumen ini mendefinisikan parameter validasi input pengguna di sisi klien (*client-side validation*) menggunakan pustaka **Zod** pada antarmuka autentikasi aplikasi **HadirIn** (Sesuai Desain Figma).

---

## 1. Skema Formulir Masuk (Login Form Schema)

File referensi: `client/src/pages/AuthPage.jsx` (`loginSchema`)

| Field | Tipe Data | Aturan Validasi | Pesan Galat (Error Message) |
| :--- | :--- | :--- | :--- |
| `email` | String | `min(1)`, format email valid | - "Email wajib diisi"<br>- "Format email tidak valid" |
| `password` | String | `min(1)`, `min(6)` karakter | - "Minimal 6 karakter" |

---

## 2. Skema Formulir Pendaftaran (Registration Form Schema)

File referensi: `client/src/pages/AuthPage.jsx` (`registerSchema`)

| Field | Tipe Data | Aturan Validasi | Pesan Galat (Error Message) |
| :--- | :--- | :--- | :--- |
| `name` | String | Wajib, min. 3 karakter | - "Nama lengkap wajib diisi"<br>- "Minimal 3 karakter" |
| `email` | String | Wajib, format email valid | - "Email wajib diisi"<br>- "Format email tidak valid" |
| `password` | String | Wajib, min. 6 karakter | - "Minimal 6 karakter" |

---

## 3. Strategi Umpan Balik Antarmuka (UI Feedback)
1. **Dynamic Error Clearing:** Pesan error di bawah kolom input akan otomatis hilang saat pengguna mengetik ulang.
2. **Visual Focus State:** Kolom input yang aktif diberi aksen border dan shadow bernuansa neon lime (`#ccff00`) sesuai desain Figma.
3. **Password Toggle:** Tombol intip kata sandi (ikon mata) untuk melihat atau menyembunyikan karakter kata sandi.