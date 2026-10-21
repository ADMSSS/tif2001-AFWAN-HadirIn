## Description
Jelaskan secara ringkas fitur baru yang ditambahkan, refactoring yang dilakukan, atau bug yang diperbaiki.

## Type of Change
- [ ] `feat`: Fitur baru
- [ ] `fix`: Perbaikan bug
- [ ] `refactor`: Refaktorisasi kode tanpa mengubah fungsionalitas
- [ ] `test`: Penambahan atau pembaruan unit/integration test
- [ ] `docs` / `chore`: Pembaruan dokumentasi atau konfigurasi dependensi

## Related Issue
Closes #

## Developer Checklist (diisi penulis PR)
- [ ] Local testing sudah dijalankan dan dinyatakan pass.
- [ ] Tidak ada berkas kredensial sensitif atau environment file (.env) yang ter-commit.
- [ ] Kode mematuhi linting rules dan naming conventions tim.
- [ ] Branch dibuat dari `main` dengan format `feat/...`, `fix/...`, atau `chore/...`.

## Evidence / Screenshots
(Sertakan screenshot antarmuka atau output log testing di sini)

---

## Reviewer Checklist (diisi rekan yang mereview)

**Fungsional**
- [ ] Perubahan sesuai dengan deskripsi dan issue terkait.
- [ ] Validasi input dan penanganan error sudah ada.

**Kualitas Kode**
- [ ] Penamaan variabel/fungsi jelas dan konsisten.
- [ ] Tidak ada kode mati, kode yang di-comment, atau `console.log` yang tertinggal.
- [ ] Tidak ada duplikasi kode yang bisa disederhanakan.

**Keamanan**
- [ ] Tidak ada secret, token, atau `.env` di dalam commit.
- [ ] Password disimpan dalam bentuk hash, bukan teks asli.
- [ ] Endpoint yang butuh login sudah diproteksi JWT.

**Integrasi (Client - Server)**
- [ ] URL dan format request/response API cocok antara client dan server.
- [ ] Perubahan skema database sudah diperbarui di `docs/database_schema.sql`.

**Testing & Dokumentasi**
- [ ] Ada bukti pengujian (screenshot atau log) yang cukup.
- [ ] README/docs diperbarui jika ada perubahan cara setup.

**Keputusan Reviewer**
- [ ] Approve
- [ ] Request changes

Catatan reviewer:cd 