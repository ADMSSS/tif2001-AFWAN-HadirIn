import { useState } from 'react';
import { Crown, UserRound } from 'lucide-react';
import { z } from 'zod';
import InputText from '../components/InputText';
import PrimaryButton from '../components/PrimaryButton';
import { authService } from '../services/api';

// ─── Wordmark (1:1 dari Figma Make ui.tsx) ────────────────────────────────────
export function Wordmark({ dark = false, className = '' }) {
  return (
    <span
      className={`font-display font-extrabold tracking-tight leading-none ${className}`}
    >
      Hadir
      <span
        className={
          dark
            ? 'text-accent'
            : 'bg-foreground text-accent px-1.5 ml-0.5 rounded-sm'
        }
      >
        In
      </span>
    </span>
  );
}

// ─── Zod Validation Schemas ───────────────────────────────────────────────────
const tenantLoginSchema = z.object({
  code: z.string().min(1, 'Kode perusahaan, NIK, dan kata sandi wajib diisi.'),
  nik: z
    .string()
    .min(1, 'Kode perusahaan, NIK, dan kata sandi wajib diisi.')
    .length(16, 'NIK harus terdiri dari 16 digit angka.'),
  password: z
    .string()
    .min(1, 'Kode perusahaan, NIK, dan kata sandi wajib diisi.'),
});

const superAdminLoginSchema = z.object({
  nik: z.string().min(1, 'Username dan kata sandi wajib diisi.'),
  password: z.string().min(1, 'Username dan kata sandi wajib diisi.'),
});

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('tenant');
  const [code, setCode] = useState('');
  const [nik, setNik] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const switchMode = (m) => {
    setMode(m);
    setError('');
    setCode('');
    setNik('');
    setPassword('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'super') {
      const parsed = superAdminLoginSchema.safeParse({ nik, password });
      if (!parsed.success) {
        setError('Username dan kata sandi wajib diisi.');
        return;
      }
      setLoading(true);
      try {
        const res = await authService.loginSuperAdmin({
          username: nik,
          password,
        });
        if (onAuth) onAuth(res);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            'Username atau kata sandi Super Admin salah.',
        );
      } finally {
        setLoading(false);
      }
      return;
    }

    const parsed = tenantLoginSchema.safeParse({ code, nik, password });
    if (!parsed.success) {
      setError(
        parsed.error.errors[0]?.message ||
          'Kode perusahaan, NIK, dan kata sandi wajib diisi.',
      );
      return;
    }

    setLoading(true);
    try {
      const res = await authService.loginTenant({
        companyCode: code,
        nik,
        password,
      });
      if (onAuth) onAuth(res);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Kode perusahaan, NIK, atau kata sandi tidak sesuai.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative">
      <header className="hidden lg:block relative bg-accent text-foreground h-[21vh] min-h-[170px]">
        <div className="absolute top-6 left-10">
          <Wordmark className="text-4xl" />
        </div>
        <h1 className="absolute inset-0 flex flex-col items-center justify-center text-center font-display font-extrabold text-5xl leading-[1.1] tracking-tight">
          <span>Hadir di kantor,</span>
          <span>
            bukan di{' '}
            <span className="inline-block bg-foreground text-accent px-3 py-0.5 rounded-sm -rotate-1">
              peta palsu.
            </span>
          </span>
        </h1>
      </header>

      <header className="lg:hidden bg-accent text-foreground px-6 sm:px-8 py-8 flex flex-col gap-10">
        <Wordmark className="text-3xl" />
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl leading-[1.05] tracking-tight max-w-sm">
          Hadir di kantor,
          <br />
          bukan di
          <br />
          <span className="inline-block bg-foreground text-accent px-2 py-0.5 rounded-sm -rotate-1 mt-1">
            peta palsu.
          </span>
        </h1>
      </header>

      <section className="px-6 lg:px-14">
        <div className="w-full lg:w-[80%] max-w-[1400px] mx-auto">
          <div className="lg:min-h-[79svh] flex flex-col justify-start lg:justify-center pt-8 lg:pt-6 pb-10">
            <h2 className="font-display text-3xl lg:text-5xl font-extrabold tracking-tight">
              {mode === 'tenant'
                ? 'Masuk ke ruang kerja Anda'
                : 'Konsol Super Admin'}
            </h2>
            <p className="text-muted-foreground text-sm lg:text-xl mt-1.5 lg:mt-3 mb-6 lg:mb-10">
              {mode === 'tenant'
                ? 'Gunakan akun yang telah didaftarkan oleh admin perusahaan Anda.'
                : 'Kelola tenant, lisensi, dan isolasi data tanpa melihat data pribadi karyawan.'}
            </p>

            <form
              onSubmit={submit}
              className="space-y-4 lg:space-y-7 lg:text-2xl lg:[&_label>span:first-child]:text-base lg:[&_label>div]:px-7 lg:[&_label>div]:py-5 lg:[&_label>div]:mt-2.5 lg:[&_label>div+span]:text-base"
              noValidate
            >
              {mode === 'tenant' && (
                <InputText
                  id="login-code"
                  name="code"
                  label="Kode perusahaan"
                  hint="Diberikan oleh admin perusahaan, mis. NLG"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="NLG"
                  inputClassName="font-mono tracking-widest"
                  autoComplete="organization"
                  disabled={loading}
                />
              )}

              <InputText
                id="login-nik"
                name="nik"
                label={mode === 'tenant' ? 'NIK' : 'Username'}
                value={nik}
                onChange={(e) =>
                  setNik(
                    mode === 'tenant'
                      ? e.target.value.replace(/\D/g, '').slice(0, 16)
                      : e.target.value,
                  )
                }
                inputMode={mode === 'tenant' ? 'numeric' : 'text'}
                placeholder={mode === 'tenant' ? '16 digit NIK' : 'superadmin'}
                inputClassName={
                  mode === 'tenant' ? 'font-mono tracking-wider' : ''
                }
                autoComplete="username"
                disabled={loading}
              />

              <InputText
                id="login-password"
                name="password"
                type="password"
                label="Kata sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
              />

              {error && (
                <p
                  role="alert"
                  className="text-sm font-medium text-destructive border-l-4 border-destructive pl-3 py-1"
                >
                  {error}
                </p>
              )}

              <PrimaryButton type="submit" loading={loading}>
                Masuk
              </PrimaryButton>
            </form>

            <button
              type="button"
              onClick={() => switchMode(mode === 'tenant' ? 'super' : 'tenant')}
              className="mt-4 lg:mt-6 flex items-center gap-2 text-sm lg:text-lg font-medium underline underline-offset-4 hover:text-muted-foreground"
            >
              {mode === 'tenant' ? (
                <Crown className="w-4 h-4" />
              ) : (
                <UserRound className="w-4 h-4" />
              )}
              {mode === 'tenant'
                ? 'Masuk sebagai Super Admin platform'
                : 'Kembali ke login perusahaan'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
