import { useState } from 'react';
import { QrCode, Camera, Clock } from 'lucide-react';
import { z } from 'zod';
import InputText from '../components/InputText';
import PrimaryButton from '../components/PrimaryButton';

// ─── Validation Schemas ───────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(6, 'Minimal 6 karakter'),
});

const registerSchema = z.object({
  name: z.string().min(1, 'Nama lengkap wajib diisi').min(3, 'Minimal 3 karakter'),
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(6, 'Minimal 6 karakter'),
});

// ─── Login Form ───────────────────────────────────────────────────────────────
function LoginForm() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = loginSchema.safeParse(form);
    if (!result.success) {
      const errs = {};
      result.error.errors.forEach(err => { errs[err.path[0]] = err.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    // Diintegrasikan dengan backend endpoint pada Pertemuan 7
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-[26px] font-extrabold text-[#111] tracking-tight leading-tight mb-1">
        Selamat datang kembali
      </h2>
      <p className="text-[14px] text-[#666] mb-7 leading-relaxed">
        Masuk untuk absen atau{' '}
        <span className="text-[#8a6c00] underline decoration-dotted cursor-pointer">
          memantau kehadiran tim
        </span>
        .
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <InputText
          id="login-email"
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="nama@perusahaan.id"
          error={errors.email}
        />

        <InputText
          id="login-password"
          label="Kata Sandi"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Minimal 6 karakter"
          error={errors.password}
        />

        <div className="pt-2">
          <PrimaryButton type="submit" loading={loading}>
            Masuk
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}

// ─── Register Form ────────────────────────────────────────────────────────────
function RegisterForm() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = registerSchema.safeParse(form);
    if (!result.success) {
      const errs = {};
      result.error.errors.forEach(err => { errs[err.path[0]] = err.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    // Diintegrasikan dengan backend endpoint pada Pertemuan 7
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-[26px] font-extrabold text-[#111] tracking-tight leading-tight mb-1">
        Buat akun HadirIn
      </h2>
      <p className="text-[14px] text-[#666] mb-7 leading-relaxed">
        Gunakan email berawalan &ldquo;admin&rdquo; untuk mendaftar sebagai{' '}
        <span className="text-[#8a6c00] underline decoration-dotted cursor-pointer font-semibold">
          Admin
        </span>
        .
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <InputText
          id="reg-name"
          label="Nama Lengkap"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Contoh: Dewi Lestari"
          error={errors.name}
        />

        <InputText
          id="reg-email"
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="nama@perusahaan.id"
          error={errors.email}
        />

        <InputText
          id="reg-password"
          label="Kata Sandi"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Minimal 6 karakter"
          error={errors.password}
        />

        <div className="pt-2">
          <PrimaryButton type="submit" loading={loading}>
            Daftar &amp; Masuk
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}

// ─── Main Auth Page ───────────────────────────────────────────────────────────
export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('masuk');

  return (
    <div className="flex min-h-screen">

      {/* ════ LEFT PANEL — Neon Lime ════ */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col justify-between p-10 relative overflow-hidden"
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
        {/* Top: Logo + Badge */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center">
            <span className="text-[26px] font-extrabold text-[#111] tracking-tight leading-none">
              Hadir
            </span>
            <span className="text-[26px] font-extrabold text-white tracking-tight leading-none bg-[#111] px-[5px] ml-[2px]">
              In
            </span>
          </div>
          <span className="border border-[#111] text-[#111] text-[10px] font-bold tracking-[0.18em] uppercase px-3 py-[5px] rounded-full">
            Absensi Karyawan
          </span>
        </div>

        {/* Middle: Tagline + Big Headline */}
        <div className="relative z-10">
          <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#333] mb-5">
            Masuk tepat waktu. Pulang tercatat.
          </p>
          <h1
            className="font-extrabold text-[#111] leading-[1.04] tracking-[-0.01em]"
            style={{ fontSize: 'clamp(40px, 4.5vw, 60px)' }}
          >
            Satu ketukan,<br />
            kehadiran<br />
            <span className="bg-[#111] text-white px-3 py-[4px] inline-block mt-2 leading-tight">
              terbukti.
            </span>
          </h1>
        </div>

        {/* Bottom: Features */}
        <div className="relative z-10 border-t border-[#111]/20 pt-5">
          <div className="flex gap-8 sm:gap-10">
            {[
              { Icon: QrCode, title: 'QR', sub: 'Scan Cepat' },
              { Icon: Camera, title: 'Kamera', sub: 'Verifikasi Wajah' },
              { Icon: Clock, title: '2 Shift', sub: 'Pagi & Malam' },
            ].map(({ Icon, title, sub }) => (
              <div key={title}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Icon size={16} className="text-[#111]" strokeWidth={2.5} />
                  <span className="text-[15px] font-extrabold text-[#111]">{title}</span>
                </div>
                <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#444]">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════ RIGHT PANEL — Cream ════ */}
      <div
        className="flex-1 flex flex-col justify-center px-8 sm:px-14 py-12 overflow-y-auto"
        style={{ backgroundColor: '#f5f0e8' }}
      >
        <div className="w-full max-w-[420px] mx-auto">

          {/* Tab Switcher */}
          <div className="flex border border-[#111] mb-8">
            <button
              type="button"
              onClick={() => setActiveTab('masuk')}
              className={[
                'flex-1 h-[48px] text-[14px] font-bold tracking-wide transition-colors cursor-pointer',
                activeTab === 'masuk'
                  ? 'bg-[#111] text-white'
                  : 'bg-white text-[#111] hover:bg-gray-100',
              ].join(' ')}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('daftar')}
              className={[
                'flex-1 h-[48px] text-[14px] font-bold tracking-wide transition-colors cursor-pointer',
                activeTab === 'daftar'
                  ? 'bg-[#111] text-[#ccff00]'
                  : 'bg-white text-[#111] hover:bg-gray-100',
              ].join(' ')}
            >
              Daftar
            </button>
          </div>

          {/* Form */}
          {activeTab === 'masuk' ? <LoginForm /> : <RegisterForm />}
        </div>
      </div>
    </div>
  );
}