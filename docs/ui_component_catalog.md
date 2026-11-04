# Katalog Komponen UI Autentikasi B2B Multi-Tenant (UI Component Catalog)

Dokumentasi spesifikasi antarmuka dan komponen modular untuk modul autentikasi platform **HadirIn B2B Multi-Tenant** berdasarkan rancangan Figma terbaru (Top Banner + Centered Workspace Login & Konsol Super Admin).

---

## 1. Panduan Palet Warna & Tipografi

* **Primary Accent:** Neon Lime (`#c5f82a`)
* **Contrast / Dark:** Deep Charcoal Black (`#14170f`)
* **Main Background:** Pure White (`#ffffff`)
* **Input Surface:** Soft Warm Off-White (`#f8f7f2`)
* **Input Border:** Muted Olive-Gray (`#6e7365`)
* **Typography:**
  * Primary Heading & Body: `Plus Jakarta Sans`, sans-serif
  * Form Label & Input Field: `JetBrains Mono`, monospace

---

## 2. Spesifikasi Komponen Modular

### A. `InputText` (`client/src/components/InputText.jsx`)
Komponen input teks bergaya monospasi dengan pengalih visibilitas kata sandi (*show/hide*) serta teks bantuan (*helper text*).

| Prop | Tipe | Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `label` | `string` | `""` | Label monospasi kapital di atas kolom input |
| `name` | `string` | Wajib | Atribut nama input |
| `type` | `string` | `'text'` | Jenis input (`text`, `password`) |
| `placeholder` | `string` | `""` | Teks petunjuk input |
| `value` | `string` | Wajib | Nilai isian formulir |
| `onChange` | `function` | Wajib | Event listener saat input berubah |
| `helperText` | `string` | `""` | Teks petunjuk di bawah kolom input |
| `error` | `string` | `""` | Pesan error validasi Zod |
| `disabled` | `boolean` | `false` | Status interaktivitas |

---

### B. `PrimaryButton` (`client/src/components/PrimaryButton.jsx`)
Tombol aksi utama berwarna `#14170f` dengan teks neon lime `#c5f82a`, ikon panah kanan, dan *offset drop-shadow* `#c5f82a` (`3px 3px 0px`).

---

### C. `AuthPage` (`client/src/pages/AuthPage.jsx`)
Halaman autentikasi dua mode:
1. **Header Banner Atas (Neon Lime `#c5f82a`):**
   * Pola garis vertikal halus, logo **HadirIn** di kiri atas, dan headline *"Hadir di kantor, bukan di **peta palsu.**"* dengan badge miring (`-rotate-1`).
2. **Mode Login Perusahaan (Pekerja & Admin Perusahaan):**
   * Judul *"Masuk ke ruang kerja Anda"*
   * Field `KODE PERUSAHAAN`, `NIK` (16 digit), dan `KATA SANDI`.
   * Tautan pengalih `Masuk sebagai Super Admin platform`.
3. **Mode Konsol Super Admin:**
   * Judul *"Konsol Super Admin"*
   * Deskripsi *"Kelola tenant, lisensi, dan isolasi data tanpa melihat data pribadi karyawan."*
   * Field `USERNAME` dan `KATA SANDI`.
   * Tautan pengalih `Kembali ke login perusahaan`.
