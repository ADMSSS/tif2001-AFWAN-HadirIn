import React, { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { useStore } from '../utils/formatters';
import { Btn, Field, inputCls } from './ui';

/**
 * ForcePassword - 1:1 dengan figma desain/src/app/component/ForcePassword.tsx
 * Muncul otomatis saat pengguna login pertama kali (mustChangePassword === true)
 * atau setelah kata sandinya di-reset oleh Admin Perusahaan.
 */
export function ForcePassword({ session }) {
  const { users, changePassword } = useStore();
  const user = users.find((u) => u.id === session?.userId);
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [err, setErr] = useState('');

  if (!user?.mustChangePassword) return null;

  const submit = (e) => {
    e.preventDefault();
    if (a.length < 8) {
      return setErr('Sandi baru minimal 8 karakter.');
    }
    if (!/\d/.test(a) || !/[A-Za-z]/.test(a)) {
      return setErr('Gunakan kombinasi huruf dan angka.');
    }
    if (user.password && a === user.password) {
      return setErr('Sandi baru tidak boleh sama dengan sandi awal.');
    }
    if (a !== b) {
      return setErr('Konfirmasi sandi tidak cocok.');
    }
    setErr('');
    changePassword(user.id, a);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="fp-title"
      className="fixed inset-0 z-50 bg-foreground/80 backdrop-blur-sm grid place-items-center p-5"
    >
      <form
        onSubmit={submit}
        noValidate
        className="w-full max-w-md bg-background border-2 border-foreground rounded-md shadow-[8px_8px_0_0_#c9f23c] p-6 space-y-4"
      >
        <div className="w-12 h-12 rounded-md bg-accent border-2 border-foreground grid place-items-center">
          <KeyRound className="w-6 h-6" />
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Login pertama
          </p>
          <h2
            id="fp-title"
            className="font-display text-3xl font-extrabold tracking-tight"
          >
            Buat sandi baru
          </h2>
          <p className="text-muted-foreground mt-1">
            Sandi awal dibuat oleh admin perusahaan. Demi keamanan, ganti dengan
            sandi pribadi sebelum melanjutkan.
          </p>
        </div>
        <Field
          label="Sandi baru"
          hint="Minimal 8 karakter, kombinasi huruf dan angka"
        >
          <input
            type="password"
            value={a}
            onChange={(e) => {
              setA(e.target.value);
              if (err) setErr('');
            }}
            className={inputCls}
            autoComplete="new-password"
            autoFocus
          />
        </Field>
        <Field label="Ulangi sandi baru">
          <input
            type="password"
            value={b}
            onChange={(e) => {
              setB(e.target.value);
              if (err) setErr('');
            }}
            className={inputCls}
            autoComplete="new-password"
          />
        </Field>
        {err && (
          <p
            role="alert"
            className="text-sm font-medium text-destructive border-l-4 border-destructive pl-3 py-1"
          >
            {err}
          </p>
        )}
        <Btn type="submit" className="w-full">
          Simpan & lanjutkan
        </Btn>
      </form>
    </div>
  );
}

export default ForcePassword;
