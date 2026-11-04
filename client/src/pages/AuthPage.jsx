import React, { useState } from 'react';
import { Crown, UserCheck } from 'lucide-react';
import { z } from 'zod';
import InputText from '../components/InputText';
import PrimaryButton from '../components/PrimaryButton';
import { authService } from '../services/api';

/**
 * Wordmark - 1:1 dengan komponen Wordmark pada figma desain/src/app/component/ui.tsx
 */
export function Wordmark({ dark = false, className = 'text-2xl' }) {
  return (
    <div
      className={`inline-flex items-baseline gap-1 font-display font-extrabold tracking-tight select-none ${className}`}
    >
      <span className={dark ? 'text-sidebar-foreground' : 'text-foreground'}>
        Hadir
      </span>
      <span
        className={`px-1.5 py-0.5 rounded-sm ${
          dark ? 'bg-accent text-foreground' : 'bg-foreground text-accent'
        }`}
      >
        In
      </span>
    </div>
  );
}

// ─── Skema Validasi Zod ──────────────────────────────────────────────────────
const tenantLoginSchema = z.object({
  companyCode: z.string().min(1, 'Kode perusahaan wajib diisi.'),
  nik: z
    .string()
    .min(1, 'NIK wajib diisi.')
    .regex(/^\d{16}$/, 'NIK harus terdiri dari 16 digit angka.'),
  password: z.string().min(1, 'Kata sandi wajib diisi.'),
});

const superAdminLoginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi.'),
  password: z.string().min(1, 'Kata sandi wajib diisi.'),
});

/**
 * AuthPage - Halaman Login proporsional sesuai screenshot Figma:
 * - Header + Judul + Seluruh Input + Tombol Masuk muat dalam 1 layar (100vh) tanpa scroll
 * - Scroll ke bawah hanya untuk mengakses tombol "Masuk sebagai Super Admin platform"
 */
const AuthPage = ({ onAuth }) => {
  const [superMode, setSuperMode] = useState(false);
  const [code, setCode] = useState('NLG');
  const [nik, setNik] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [err, setErr] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const switchMode = (nextSuperMode) => {
    setSuperMode(nextSuperMode);
    setNik('');
    setPassword('');
    setErrors({});
    setErr(null);
    setSuccessMessage('');
  };

  const handleFieldChange = (field, setter) => (e) => {
    let val = e.target.value;
    if (field === 'companyCode') {
      val = val.toUpperCase();
    }
    setter(val);
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    if (err) setErr(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    setSuccessMessage('');

    const payload = superMode
      ? { username: nik.trim(), password }
      : { companyCode: code.trim(), nik: nik.trim(), password };

    const activeSchema = superMode ? superAdminLoginSchema : tenantLoginSchema;
    const parsed = activeSchema.safeParse(payload);

    if (!parsed.success) {
      const fieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = superMode
        ? await authService.loginSuperAdmin(parsed.data)
        : await authService.loginTenant(parsed.data);

      const token = response?.data?.token || response?.token;
      if (token) {
        localStorage.setItem('hadirin_token', token);
      }
      if (onAuth) {
        onAuth(response);
      }

      setSuccessMessage(
        superMode
          ? 'Autentikasi Konsol Super Admin berhasil.'
          : `Autentikasi ruang kerja (${parsed.data.companyCode}) berhasil.`
      );
    } catch (apiError) {
      setErr(
        apiError?.response?.data?.message ||
          apiError?.message ||
          (superMode
            ? 'Kredensial Super Admin tidak valid.'
            : 'Kode perusahaan, NIK, atau kata sandi tidak cocok.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header Desktop: proporsional 18vh sehingga seluruh form input muat dalam 1 layar */}
      <header className="hidden lg:block relative bg-accent text-foreground h-[18vh] min-h-[115px] max-h-[155px]">
        <div className="absolute top-4 left-7">
          <Wordmark className="text-2xl" />
        </div>
        <div className="h-full flex items-center justify-center px-10 text-center">
          <h1 className="font-display font-extrabold text-3xl xl:text-[34px] leading-[1.15] tracking-tight">
            Hadir di kantor,
            <br />
            bukan di{' '}
            <span className="inline-block bg-foreground text-accent px-2.5 py-0.5 rounded-sm -rotate-1">
              peta palsu.
            </span>
          </h1>
        </div>
      </header>

      {/* Header Mobile */}
      <header className="lg:hidden bg-accent text-foreground px-6 sm:px-8 py-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Wordmark className="text-2xl" />
        </div>
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl leading-[1.12] tracking-tight">
            Hadir di kantor, bukan di{' '}
            <span className="inline-block bg-foreground text-accent px-2 py-0.5 rounded-sm -rotate-1">
              peta palsu.
            </span>
          </h1>
        </div>
      </header>

      {/* Bagian Form: 1 layar penuh (82vh) untuk Judul + Input + Tombol Masuk, scroll hanya untuk tombol Super Admin */}
      <section className="flex-1 flex flex-col px-6 lg:px-14">
        <div className="w-full lg:w-[74%] max-w-[920px] mx-auto">
          {/* Area 1 Interface (Tanpa Scroll di Desktop) */}
          <div className="lg:min-h-[82vh] flex flex-col justify-start lg:justify-center pt-6 lg:py-4">
            <h2 className="font-display text-2xl lg:text-[30px] font-extrabold tracking-tight leading-tight">
              {superMode ? 'Konsol Super Admin' : 'Masuk ke ruang kerja Anda'}
            </h2>
            <p className="text-muted-foreground mt-1 text-xs lg:text-sm">
              {superMode
                ? 'Kelola tenant, lisensi, dan isolasi data tanpa melihat data pribadi karyawan.'
                : 'Gunakan akun yang telah didaftarkan oleh admin perusahaan Anda.'}
            </p>

            <form onSubmit={submit} className="mt-4 lg:mt-5 space-y-3 lg:space-y-3.5" noValidate>
              {!superMode && (
                <InputText
                  label="Kode perusahaan"
                  name="companyCode"
                  value={code}
                  onChange={handleFieldChange('companyCode', setCode)}
                  placeholder="NLG"
                  mono
                  hint="Diberikan oleh admin perusahaan, mis. NLG"
                  error={errors.companyCode}
                  disabled={isSubmitting}
                />
              )}

              <InputText
                label={superMode ? 'Username' : 'NIK'}
                name={superMode ? 'username' : 'nik'}
                value={nik}
                onChange={handleFieldChange(superMode ? 'username' : 'nik', setNik)}
                placeholder={superMode ? 'superadmin' : '16 digit NIK'}
                mono={!superMode}
                inputMode={superMode ? 'text' : 'numeric'}
                maxLength={superMode ? undefined : 16}
                error={superMode ? errors.username : errors.nik}
                disabled={isSubmitting}
              />

              <InputText
                label="Kata sandi"
                name="password"
                type="password"
                value={password}
                onChange={handleFieldChange('password', setPassword)}
                placeholder="••••••••"
                error={errors.password}
                disabled={isSubmitting}
              />

              {err && (
                <div
                  role="alert"
                  className="border-2 border-destructive bg-destructive/10 text-destructive px-3.5 py-2 rounded-md text-xs font-medium"
                >
                  {err}
                </div>
              )}

              {successMessage && (
                <div
                  role="status"
                  className="border-2 border-foreground bg-accent/35 text-foreground px-3.5 py-2 rounded-md text-xs font-medium"
                >
                  {successMessage}
                </div>
              )}

              <div className="pt-1">
                <PrimaryButton type="submit" isLoading={isSubmitting}>
                  Masuk
                </PrimaryButton>
              </div>
            </form>
          </div>

          {/* Area Bawah (Muncul saat di-scroll ke bawah) */}
          <div className="pt-2 pb-8">
            <button
              type="button"
              onClick={() => switchMode(!superMode)}
              className="text-xs lg:text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 cursor-pointer"
            >
              {superMode ? (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span className="underline underline-offset-4">
                    Kembali ke login perusahaan
                  </span>
                </>
              ) : (
                <>
                  <Crown className="w-3.5 h-3.5" />
                  <span className="underline underline-offset-4">
                    Masuk sebagai Super Admin platform
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AuthPage;
