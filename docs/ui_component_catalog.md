# Katalog Komponen UI Autentikasi B2B Multi-Tenant (UI Component Catalog)

Dokumentasi spesifikasi antarmuka dan komponen modular untuk modul autentikasi platform **HadirIn B2B Multi-Tenant** berdasarkan rancangan Figma Make (`figma desain/`) 1:1 (Top Banner + Centered Workspace Login & Konsol Super Admin, tanpa kotak/panel demo).

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

## 2. Spesifikasi Komponen Modular

### A. `InputText` (`client/src/components/InputText.jsx`)
Komponen input formulir 1:1 dengan komponen `Field` pada Figma (`border-2 border-foreground rounded-md bg-card focus-within:shadow-[4px_4px_0_0_#c9f23c] focus-within:-translate-y-px transition-all`), mendukung pengalih visibilitas kata sandi (*show/hide*) serta teks bantuan (*hint/helperText*).

| Prop | Tipe | Default | Deskripsi |
| :--- | :--- | :--- | :--- |
| `label` | `string` | `""` | Label monospasi kapital (`font-mono text-xs uppercase tracking-wider`) |
| `name` | `string` | Wajib | Atribut nama input |
| `type` | `string` | `'text'` | Jenis input (`text`, `password`) |
| `placeholder` | `string` | `""` | Teks petunjuk input |
| `value` | `string` | Wajib | Nilai isian formulir |
| `onChange` | `function` | Wajib | Event listener saat input berubah |
| `helperText` / `hint` | `string` | `""` | Teks petunjuk di bawah kolom input |
| `error` | `string` | `""` | Pesan error validasi Zod |
| `mono` | `boolean` | `false` | Mengaktifkan `font-mono` pada teks input |
| `disabled` | `boolean` | `false` | Status interaktivitas |

---

### B. `PrimaryButton` (`client/src/components/PrimaryButton.jsx`)
Tombol aksi utama 1:1 dengan desain Figma (`bg-foreground text-accent font-display font-bold text-lg lg:text-2xl px-5 lg:px-8 py-4 lg:py-6 rounded-md shadow-[4px_4px_0_0_#c9f23c] border-2 border-foreground hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#c9f23c]`).

---

### C. `AuthPage` (`client/src/pages/AuthPage.jsx`)
Halaman autentikasi dua mode dengan struktur 1:1 sesuai `AuthPage.tsx`:
1. **Header Banner Atas (`bg-accent text-foreground h-[21vh] min-h-[170px]`):**
   * Komponen `Wordmark` (`Hadir` + kotak `In` dengan `font-display font-extrabold tracking-tight text-4xl`) di pojok kiri atas (`absolute top-6 left-10`).
   * Headline terpusat (`font-display font-extrabold text-5xl leading-[1.1] tracking-tight`) *"Hadir di kantor, bukan di **peta palsu.**"* dengan badge miring (`inline-block bg-foreground text-accent px-3 py-0.5 rounded-sm -rotate-1`).
2. **Mode Login Perusahaan (Karyawan & Admin Perusahaan):**
   * Kontainer `w-full lg:w-[80%] max-w-[1400px] mx-auto` dengan `lg:min-h-[79svh]`.
   * Judul *"Masuk ke ruang kerja Anda"* (`text-3xl lg:text-5xl font-extrabold`).
   * Field `Kode perusahaan`, `NIK` (16 digit), dan `Kata sandi`.
   * Tautan pengalih `Masuk sebagai Super Admin platform`.
3. **Mode Konsol Super Admin:**
   * Judul *"Konsol Super Admin"*
   * Deskripsi *"Kelola tenant, lisensi, dan isolasi data tanpa melihat data pribadi karyawan."*
   * Field `Username` dan `Kata sandi`.
   * Tautan pengalih `Kembali ke login perusahaan`.
