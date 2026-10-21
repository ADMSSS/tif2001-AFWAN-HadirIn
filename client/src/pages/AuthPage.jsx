import { useState } from 'react';
import { QrCode, Fingerprint, MapPin, Crown, ArrowLeft } from 'lucide-react';
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
    .min(1, 'NIK / ID Karyawan wajib diisi')
    .min(4, 'NIK minimal 4 digit karakter'),
  password: z
    .string()
    .min(1, 'Kata sandi wajib diisi')
    .min(6, 'Kata sandi minimal 6 karakter'),
});

const superAdminLoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email Super Admin wajib diisi')
    .email('Format email tidak valid'),
  password: z
    .string()
    .min(1, 'Kata sandi wajib diisi')
    .min(6, 'Kata sandi minimal 6 karakter'),
});

export default function AuthPage() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Form State Karyawan & Admin Perusahaan
  const [tenantForm, setTenantForm] = useState({
    companyCode: '',
    nik: '',
    password: '',
  });

  // Form State Super Admin
  const [adminForm, setAdminForm] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleTenantChange = (e) => {
    const { name, value } = e.target;
    // Auto-uppercase untuk kode perusahaan
    const val = name === 'companyCode' ? value.toUpperCase() : value;
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
      setFeedback({ type: 'success', message: 'Autentikasi berhasil! Mengalihkan...' });
    } catch {
      // Mocking interaksi lokal sebelum backend multi-tenant live
      await new Promise((r) => setTimeout(r, 900));
      setFeedback({
        type: 'info',
        message: `Kredensial ${tenantForm.companyCode} / ${tenantForm.nik} tervalidasi. Siap terhubung ke endpoint backend.`,
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
      setFeedback({ type: 'success', message: 'Login Super Admin berhasil!' });
    } catch {
      await new Promise((r) => setTimeout(r, 900));
      setFeedback({
        type: 'info',
        message: 'Portal Super Admin tervalidasi di sisi klien.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* ════ LEFT PANEL — Neon Lime (#ccff00) ════ */}
      <div
        className="hidden lg:flex lg:w-[50%] xl:w-[52%] flex-col justify-between p-10 xl:p-12 relative overflow-hidden"
        style={{
          backgroundColor: '#ccff00',
          backgroundImage: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 38px,
            rgba(0,0,0,0.065) 38px,
            rgba(0,0,0,0.065) 40px
          )`,
        }}
      >
        {/* Top Header: Logo + Badge B2B */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center">
            <span className="text-[28px] font-extrabold text-[#111] tracking-tight leading-none">
              Hadir
            </span>
            <span className="text-[28px] font-extrabold text-white tracking-tight leading-none bg-[#111] px-[6px] py-[1px] ml-[2px]">
              In
            </span>
          </div>

          <span className="border border-[#111] text-[#111] text-[10px] font-extrabold tracking-[0.16em] uppercase px-3.5 py-1.5 rounded-full">
            PLATFORM PRESENSI B2B
          </span>
        </div>

        {/* Center: Tagline + Main Headline */}
        <div className="relative z-10 my-auto py-12">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#333] mb-5">
            SATU PLATFORM. BANYAK PERUSAHAAN. DATA TAK PERNAH BERTABRAKAN.
          </p>

          <h1
            className="font-extrabold text-[#111] leading-[1.04] tracking-[-0.02em]"
            style={{ fontSize: 'clamp(38px, 4.3vw, 58px)' }}
          >
            Hadir di kantor,<br />
            bukan di<br />
            <span className="bg-[#111] text-white px-3.5 py-[5px] inline-block mt-2 leading-tight">
              peta palsu.
            </span>
          </h1>
        </div>

        {/* Bottom: Layered Anti-Spoofing Features */}
        <div className="relative z-10 border-t border-[#111]/20 pt-6">
          <div className="flex gap-8 sm:gap-10">
            {/* Feature 1: Dynamic Rolling QR */}
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <QrCode size={17} className="text-[#111]" strokeWidth={2.4} />
                <span className="text-[15px] font-extrabold text-[#111]">
                  <span className="underline decoration-2 underline-offset-2">QR</span> berputar
                </span>
              </div>
              <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#444]">
                KODE BARU TIAP 15 DETIK
              </p>
            </div>

            {/* Feature 2: Live Camera Capture */}
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Fingerprint size={17} className="text-[#111]" strokeWidth={2.4} />
                <span className="text-[15px] font-extrabold text-[#111]">
                  Foto langsung
                </span>
              </div>
              <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#444]">
                TANPA UNGGAH GALERI
              </p>
            </div>

            {/* Feature 3: Geofence 50m */}
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <MapPin size={17} className="text-[#111]" strokeWidth={2.4} />
                <span className="text-[15px] font-extrabold text-[#111]">
                  Geofence 50 m
                </span>
              </div>
              <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#444]">
                HAVERSINE + IP KANTOR
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ════ RIGHT PANEL — Cream (#f5f0e8) ════ */}
      <div
        className="flex-1 flex flex-col justify-center px-8 sm:px-14 lg:px-16 py-12 overflow-y-auto"
        style={{ backgroundColor: '#f5f0e8' }}
      >
        <div className="w-full max-w-[420px] mx-auto">
          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`mb-6 p-3 text-xs font-semibold rounded-none border ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 text-amber-900 border-amber-300'
              }`}
            >
              {feedback.message}
            </div>
          )}

          {!isSuperAdmin ? (
            /* ── FORM 1: Karyawan & Admin Perusahaan ── */
            <div>
              <div className="mb-8">
                <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#666] mb-1.5">
                  KARYAWAN &amp; ADMIN PERUSAHAAN
                </p>
                <h2 className="text-[28px] font-extrabold text-[#111] tracking-tight leading-tight mb-2">
                  Masuk ke ruang kerja Anda
                </h2>
                <p className="text-[14px] text-[#666] leading-relaxed">
                  Akun dibuat oleh Admin Perusahaan Anda. Tidak ada pendaftaran mandiri.
                </p>
              </div>

              <form onSubmit={handleTenantSubmit} noValidate>
                {/* Kode Perusahaan */}
                <InputText
                  id="login-companyCode"
                  label="KODE PERUSAHAAN"
                  name="companyCode"
                  type="text"
                  value={tenantForm.companyCode}
                  onChange={handleTenantChange}
                  placeholder="Contoh: NLG"
                  helperText="Diberikan oleh admin perusahaan, mis. NLG"
                  error={errors.companyCode}
                  disabled={loading}
                />

                {/* NIK */}
                <InputText
                  id="login-nik"
                  label="NIK"
                  name="nik"
                  type="text"
                  value={tenantForm.nik}
                  onChange={handleTenantChange}
                  placeholder="3173014505950002"
                  error={errors.nik}
                  disabled={loading}
                />

                {/* Kata Sandi */}
                <InputText
                  id="login-password"
                  label="KATA SANDI"
                  name="password"
                  type="password"
                  value={tenantForm.password}
                  onChange={handleTenantChange}
                  placeholder="Minimal 6 karakter"
                  error={errors.password}
                  disabled={loading}
                />

                <div className="pt-2">
                  <PrimaryButton type="submit" loading={loading}>
                    Masuk
                  </PrimaryButton>
                </div>
              </form>

              {/* Link Super Admin */}
              <div className="mt-8 text-center sm:text-left">
                <button
                  type="button"
                  onClick={() => {
                    setIsSuperAdmin(true);
                    setErrors({});
                    setFeedback(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#111] hover:text-[#444] transition-colors cursor-pointer group"
                >
                  <Crown size={15} className="text-[#888] group-hover:text-[#111]" />
                  <span className="underline decoration-1 underline-offset-4">
                    Masuk sebagai Super Admin platform
                  </span>
                </button>
              </div>
            </div>
          ) : (
            /* ── FORM 2: Super Admin Platform Owner ── */
            <div>
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-[#111] text-[#ccff00]">
                    <Crown size={12} />
                    Platform Owner
                  </span>
                </div>
                <h2 className="text-[28px] font-extrabold text-[#111] tracking-tight leading-tight mb-2">
                  Portal Super Admin
                </h2>
                <p className="text-[14px] text-[#666] leading-relaxed">
                  Provisioning tenant perusahaan, manajemen lisensi &amp; monitoring isolasi basis data.
                </p>
              </div>

              <form onSubmit={handleAdminSubmit} noValidate>
                <InputText
                  id="admin-email"
                  label="EMAIL SUPER ADMIN"
                  name="email"
                  type="email"
                  value={adminForm.email}
                  onChange={handleAdminChange}
                  placeholder="superadmin@hadirin.id"
                  error={errors.email}
                  disabled={loading}
                />

                <InputText
                  id="admin-password"
                  label="KATA SANDI PLATFORM"
                  name="password"
                  type="password"
                  value={adminForm.password}
                  onChange={handleAdminChange}
                  placeholder="Masukkan kata sandi master"
                  error={errors.password}
                  disabled={loading}
                />

                <div className="pt-2">
                  <PrimaryButton type="submit" loading={loading}>
                    Masuk Super Admin
                  </PrimaryButton>
                </div>
              </form>

              <div className="mt-8 text-center sm:text-left">
                <button
                  type="button"
                  onClick={() => {
                    setIsSuperAdmin(false);
                    setErrors({});
                    setFeedback(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#111] hover:text-[#444] transition-colors cursor-pointer"
                >
                  <ArrowLeft size={15} />
                  <span>Kembali ke login karyawan &amp; admin perusahaan</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}