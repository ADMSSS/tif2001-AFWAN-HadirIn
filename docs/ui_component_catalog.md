# Katalog Komponen UI Autentikasi B2B Multi-Tenant (UI Component Catalog)

Dokumentasi spesifikasi antarmuka dan komponen modular untuk modul autentikasi platform **HadirIn B2B Multi-Tenant** berdasarkan rancangan Figma v2.

---

## 1. Panduan Palet Warna & Tipografi

* **Primary Accent:** Neon Lime (`#ccff00`)
* **Contrast / Dark:** Solid Black (`#111111`)
* **Background Panel Kanan:** Warm Cream / Sand (`#f5f0e8`)
* **Border & Focus:** Border `#111111`, Focus Ring `rgba(204,255,0,0.25)`
* **Typography:**
  * Font Family: `Plus Jakarta Sans`, `Space Grotesk`, sans-serif
  * Headline: `text-[38px]` s/d `text-[58px]`, font weight 800 (Extrabold)
  * Form Title: `text-[28px]`, font weight 800 (Extrabold)
  * Input Label: `text-[11px]`, font weight 700 (Bold), tracking 0.14em uppercase

---

## 2. Spesifikasi Komponen Modular

### A. `InputText` (`client/src/components/InputText.jsx`)
Komponen input teks yang mendukung tipe teks umum, email, dan kata sandi dengan pengalih visibilitas (show/hide) serta teks bantuan (*helper text*).

| Prop | Tipe | Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `label` | `string` | `""` | Label huruf kapital kecil di atas kolom input |
| `name` | `string` | Wajib | Atribut nama input |
| `type` | `string` | `'text'` | Jenis input (`text`, `email`, `password`) |
| `placeholder` | `string` | `""` | Teks petunjuk input |
| `value` | `string` | Wajib | Nilai isian formulir |
| `onChange` | `function` | Wajib | Event listener saat input berubah |
| `helperText` | `string` | `""` | Teks petunjuk abu-abu di bawah kolom input |
| `error` | `string` | `""` | Pesan error validasi Zod |
| `disabled` | `boolean` | `false` | Status interaktivitas |

---

### B. `PrimaryButton` (`client/src/components/PrimaryButton.jsx`)
Tombol aksi utama bernuansa hitam pekat (`#111`) dengan tipografi neon lime (`#ccff00`) dan ikon panah (`→`).

| Prop | Tipe | Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `children` | `node` | Wajib | Label teks tombol |
| `type` | `string` | `'button'` | Atribut jenis tombol (`submit`, `button`) |
| `loading` | `boolean` | `false` | Status loading / memproses |
| `disabled` | `boolean` | `false` | Status nonaktif |

---

### C. `AuthPage` (`client/src/pages/AuthPage.jsx`)
Halaman autentikasi B2B Multi-Tenant terpadu:
* **Panel Kiri (Neon Lime #ccff00):**
  * Pola garis vertikal halus transparan.
  * Logo HadirIn + kapsul badge `PLATFORM PRESENSI B2B`.
  * Tagline: `SATU PLATFORM. BANYAK PERUSAHAAN. DATA TAK PERNAH BERTABRAKAN.`
  * Headline: *"Hadir di kantor, bukan di **peta palsu.**"*
  * Tiga fitur mitigasi anti-kecurangan:
    1. **QR berputar** (`KODE BARU TIAP 15 DETIK`)
    2. **Foto langsung** (`TANPA UNGGAH GALERI`)
    3. **Geofence 50 m** (`HAVERSINE + IP KANTOR`)
* **Panel Kanan (Warm Cream #f5f0e8):**
  * Judul: *"Masuk ke ruang kerja Anda"*
  * Deskripsi: *"Akun dibuat oleh Admin Perusahaan Anda. Tidak ada pendaftaran mandiri."*
  * Input Kode Perusahaan (dengan helper text "Diberikan oleh admin perusahaan, mis. NLG").
  * Input NIK & Kata Sandi.
  * Tombol Masuk.
  * Tautan pengalih portal *"Masuk sebagai Super Admin platform"* dengan formulir khusus Platform Owner.