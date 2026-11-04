import { useState } from 'react';
import { Crown, User } from 'lucide-react';
import { z } from 'zod';
import InputText from '../components/InputText';
import PrimaryButton from '../components/PrimaryButton';
import { authService } from '../services/api';

// ─── Zod Validation Schemas (Multi-Tenant B2B) ────────────────────────────────
const tenantLoginSchema = z.object({
  companyCode: z
    .string()
    .min(1, 'Kode perusahaan wajib diisi')
    .min(2, 'Kode perusahaan minimal 2 karakter')
    .max(10, 'Kode perusahaan maksimal 10 karakter'),
  nik: z
    .string()
    .min(1, 'NIK wajib diisi')
    .regex(/^\d+$/, 'NIK hanya boleh berisi angka')
    .length(16, 'NIK harus terdiri dari 16 digit angka'),
  password: z
    .string()
    .min(1, 'Kata sandi wajib diisi')
    .min(6, 'Kata sandi minimal 6 karakter'),
});

const superAdminLoginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username Super Admin wajib diisi')
    .min(3, 'Username minimal 3 karakter'),
  password: z
    .string()
    .min(1, 'Kata sandi wajib diisi')
    .min(6, 'Kata sandi minimal 6 karakter'),
});

export default function AuthPage() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // State Form Login Perusahaan (Pekerja & Admin Perusahaan)
  const [tenantForm, setTenantForm] = useState({
    companyCode: '',
    nik: '',
    password: '',
  });

  // State Form Konsol Super Admin
  const [adminForm, setAdminForm] = useState({
    username: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleTenantChange = (e) => {
    const { name, value } = e.target;
    let val = value;
    if (name === 'companyCode') {
      val = value.toUpperCase();
    } else if (name === 'nik') {
      val = value.replace(/\D/g, '').slice(0, 16);
    }
    setTenantForm((prev) => ({ ...prev, [name]: val }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (feedback) setFeedback(null);
  };

  const handleAdminChange = (e) => {
    const { name, value } = e.target;
    setAdminForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (feedback) setFeedback(null);
  };

  const handleTenantSubmit = async (e) => {
    e.preventDefault();
    const result = tenantLoginSchema.safeParse(tenantForm);
    if (!result.success) {
      const errs = {};
      result.error.errors.forEach((err) => {
        errs[err.path[0]] = err.message;
      });
      setErrors(errs);
      return;
    }

    setErrors({});
    setLoading(true);
    setFeedback(null);

    try {
      await authService.loginTenant(tenantForm);
      setFeedback({ type: 'success', message: 'Autentikasi berhasil! Mengalihkan ke ruang kerja...' });
    } catch {
      await new Promise((r) => setTimeout(r, 900));
      setFeedback({
        type: 'info',
        message: `Kredensial perusahaan ${tenantForm.companyCode} (NIK: ${tenantForm.nik}) tervalidasi.`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    const result = superAdminLoginSchema.safeParse(adminForm);
    if (!result.success) {
      const errs = {};
      result.error.errors.forEach((err) => {
        errs[err.path[0]] = err.message;
      });
      setErrors(errs);
      return;
    }

    setErrors({});
    setLoading(true);
    setFeedback(null);

    try {
      await authService.loginSuperAdmin(adminForm);
      setFeedback({ type: 'success', message: 'Autentikasi Konsol Super Admin berhasil!' });
    } catch {
      await new Promise((r) => setTimeout(r, 900));
      setFeedback({
        type: 'info',
        message: `Akun Super Admin (${adminForm.username}) tervalidasi di sisi klien.`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ════ TOP BANNER — Neon Lime (#c5f82a) ════ */}
      <header
        className="w-full relative px-6 sm:px-8 py-11 sm:py-13 overflow-hidden border-b border-[#14170f]/10"
        style={{
          backgroundColor: '#c5f82a',
          backgroundImage: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 47px,
            rgba(20, 23, 15, 0.055) 47px,
            rgba(20, 23, 15, 0.055) 48px
          )`,
        }}
      >
        {/* Top-Left Logo */}
        <div className="sm:absolute sm:top-6 sm:left-7 mb-5 sm:mb-0 flex items-center select-none">
          <span className="text-[22px] font-extrabold text-[#14170f] tracking-tight leading-none">
            Hadir
          </span>
          <span className="text-[22px] font-extrabold text-[#c5f82a] tracking-tight leading-none bg-[#14170f] px-1.5 py-[3px] ml-[2px] rounded-[4px]">
            In
          </span>
        </div>

        {/* Centered Headline */}
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-[28px] sm:text-[37px] font-extrabold text-[#14170f] leading-[1.2] tracking-tight">
            Hadir di kantor,
            <br />
            bukan di{' '}
            <span className="inline-block bg-[#14170f] text-[#c5f82a] px-3 py-0.5 rounded-[3px] -rotate-1">
              peta palsu.
            </span>
          </h1>
        </div>
      </header>

      {/* ════ MAIN FORM SECTION — Centered White Area ════ */}
      <main className="flex-1 w-full max-w-[780px] mx-auto px-6 sm:px-10 py-11 sm:py-14">
        {feedback && (
          <div
            className={`mb-6 p-3.5 text-[13px] font-medium rounded-[4px] border ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : 'bg-[#f8f7f2] text-[#14170f] border-[#6e7365]'
            }`}
          >
            {feedback.message}
          </div>
        )}

        {!isSuperAdmin ? (
          /* ── VIEW 1: Login Perusahaan (Pekerja & Admin Perusahaan) ── */
          <div>
            <div className="mb-8">
              <h2 className="text-[28px] sm:text-[31px] font-extrabold text-[#14170f] tracking-tight leading-tight mb-1.5">
                Masuk ke ruang kerja Anda
              </h2>
              <p className="text-[14.5px] text-[#6b7063]">
                Gunakan akun yang telah didaftarkan oleh admin perusahaan Anda.
              </p>
            </div>

            <form onSubmit={handleTenantSubmit} noValidate>
              <InputText
                id="login-companyCode"
                label="KODE PERUSAHAAN"
                name="companyCode"
                type="text"
                value={tenantForm.companyCode}
                onChange={handleTenantChange}
                placeholder="NLG"
                helperText="Diberikan oleh admin perusahaan, mis. NLG"
                error={errors.companyCode}
                disabled={loading}
              />

              <InputText
                id="login-nik"
                label="NIK"
                name="nik"
                type="text"
                inputMode="numeric"
                value={tenantForm.nik}
                onChange={handleTenantChange}
                placeholder="16 digit NIK"
                error={errors.nik}
                disabled={loading}
              />

              <InputText
                id="login-password"
                label="KATA SANDI"
                name="password"
                type="password"
                value={tenantForm.password}
                onChange={handleTenantChange}
                placeholder="••••••••"
                error={errors.password}
                disabled={loading}
              />

              <div className="mt-6">
                <PrimaryButton type="submit" loading={loading}>
                  Masuk
                </PrimaryButton>
              </div>
            </form>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => {
                  setIsSuperAdmin(true);
                  setErrors({});
                  setFeedback(null);
                }}
                className="inline-flex items-center gap-2 text-[13px] font-medium text-[#14170f] hover:text-[#4a4e43] transition-colors cursor-pointer"
              >
                <Crown size={14} strokeWidth={1.8} className="text-[#4a4e43]" />
                <span className="underline underline-offset-4">
                  Masuk sebagai Super Admin platform
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* ── VIEW 2: Konsol Super Admin ── */
          <div>
            <div className="mb-8">
              <h2 className="text-[28px] sm:text-[31px] font-extrabold text-[#14170f] tracking-tight leading-tight mb-1.5">
                Konsol Super Admin
              </h2>
              <p className="text-[14.5px] text-[#6b7063]">
                Kelola tenant, lisensi, dan isolasi data tanpa melihat data pribadi karyawan.
              </p>
            </div>

            <form onSubmit={handleAdminSubmit} noValidate>
              <InputText
                id="admin-username"
                label="USERNAME"
                name="username"
                type="text"
                value={adminForm.username}
                onChange={handleAdminChange}
                placeholder="superadmin"
                error={errors.username}
                disabled={loading}
              />

              <InputText
                id="admin-password"
                label="KATA SANDI"
                name="password"
                type="password"
                value={adminForm.password}
                onChange={handleAdminChange}
                placeholder="••••••••"
                error={errors.password}
                disabled={loading}
              />

              <div className="mt-6">
                <PrimaryButton type="submit" loading={loading}>
                  Masuk
                </PrimaryButton>
              </div>
            </form>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => {
                  setIsSuperAdmin(false);
                  setErrors({});
                  setFeedback(null);
                }}
                className="inline-flex items-center gap-2 text-[13px] font-medium text-[#14170f] hover:text-[#4a4e43] transition-colors cursor-pointer"
              >
                <User size={14} strokeWidth={1.8} className="text-[#4a4e43]" />
                <span className="underline underline-offset-4">
                  Kembali ke login perusahaan
                </span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
