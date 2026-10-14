# Katalog Komponen UI Autentikasi (UI Component Catalog)

Dokumentasi spesifikasi komponen antarmuka modular dan dapat digunakan kembali (*reusable components*) untuk modul autentikasi aplikasi **HadirIn** berdasarkan desain Figma.

---

## 1. Panduan Palet Warna & Tipografi

*   **Primary Accent:** Neon Lime (`#ccff00`)
*   **Contrast / Dark:** Solid Black (`#111111`)
*   **Background Right Panel:** Cream / Warm Sand (`#f5f0e8`)
*   **Typography:**
    *   Font Family: `Plus Jakarta Sans`, `Space Grotesk`, sans-serif
    *   Headline: `text-[52px]` - `text-[58px]`, font weight 800 (Extrabold)
    *   Form Title: `text-[26px]`, font weight 800 (Extrabold)
    *   Input Label: `text-[11px]`, font weight 700 (Bold), tracking 0.14em uppercase

---

## 2. Spesifikasi Komponen Modular

### A. `InputText` (`client/src/components/InputText.jsx`)
Komponen input teks yang mendukung tipe teks umum, email, dan kata sandi dengan pengalih visibilitas (show/hide).

| Prop | Tipe | Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `label` | `string` | `""` | Label huruf kapital kecil di atas kolom input |
| `name` | `string` | Wajib | Atribut nama input |
| `type` | `string` | `'text'` | Jenis input (`text`, `email`, `password`) |
| `placeholder` | `string` | `""` | Teks petunjuk input |
| `value` | `string` | Wajib | Nilai isian formulir |
| `onChange` | `function` | Wajib | Event listener saat input berubah |
| `error` | `string` | `""` | Pesan error validasi Zod |
| `disabled` | `boolean` | `false` | Status interaktivitas |

---

### B. `PrimaryButton` (`client/src/components/PrimaryButton.jsx`)
Tombol aksi utama bernuansa hitam pekat dengan tipografi neon lime dan ikon panah (`→`).

| Prop | Tipe | Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `children` | `node` | Wajib | Label teks tombol |
| `type` | `string` | `'button'` | Atribut jenis tombol |
| `loading` | `boolean` | `false` | Status loading / memproses |
| `disabled` | `boolean` | `false` | Status nonaktif |

---

### C. `AuthPage` (`client/src/pages/AuthPage.jsx`)
Halaman autentikasi terpadu:
*   **Panel Kiri (Neon Lime #ccff00):** Garis-garis vertikal halus, logo HadirIn, pill badge "ABSENSI KARYAWAN", headline "Satu ketukan, kehadiran terbukti.", serta ikon fitur (QR Scan Cepat, Kamera Verifikasi Wajah, 2 Shift Pagi & Malam).
*   **Panel Kanan (Cream #f5f0e8):** Tab switch "Masuk" & "Daftar", form login/register, dan tombol submit.