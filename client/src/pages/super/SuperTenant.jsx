import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  Layers,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import {
  dateKey,
  diffCalendarDays,
  fmtDate,
  useClock,
  useStore,
} from '../../utils/formatters';
import {
  Btn,
  Empty,
  Field,
  inputCls,
  Meter,
  PageHead,
  Panel,
  Pill,
} from '../../components/ui';

const statusOf = (t, now) =>
  t.suspended
    ? 'ditangguhkan'
    : diffCalendarDays(t.activeUntil, now) < 0
      ? 'kedaluwarsa'
      : 'aktif';

const STATUS_LABEL = {
  aktif: 'Aktif',
  kedaluwarsa: 'Kedaluwarsa',
  ditangguhkan: 'Ditangguhkan',
};

const STATUS_TONE = {
  aktif: 'ok',
  kedaluwarsa: 'warn',
  ditangguhkan: 'mute',
};

function addMonthsKey(baseDate, months) {
  const d = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth() + months,
    baseDate.getDate()
  );
  return dateKey(d);
}

function CopyBtn({ value, label }) {
  const [done, setDone] = useState(false);
  return (
    <Btn
      variant="ghost"
      size="sm"
      aria-label={`Salin ${label}`}
      onClick={() => {
        navigator.clipboard?.writeText(value).then(
          () => {
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          },
          () => {}
        );
      }}
    >
      {done ? <Check className="size-4" /> : <Copy className="size-4" />}{' '}
      {done ? 'Tersalin' : 'Salin'}
    </Btn>
  );
}

function HandoffCard({ h, onClose }) {
  const rows = [
    ['Kode perusahaan', h.code],
    ['Kunci lisensi', h.licenseKey],
    ['NIK admin', h.nik],
    ['Sandi awal', h.password],
  ];
  return (
    <Panel
      tone="accent"
      kicker="Serah terima"
      title={`Tenant ${h.name} siap dipakai`}
      action={
        <Btn
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label="Tutup kartu serah terima"
        >
          <X className="size-4" /> Tutup
        </Btn>
      }
    >
      <div className="grid sm:grid-cols-2 gap-3">
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="border-2 border-foreground rounded-md bg-card p-3 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {k}
              </p>
              <p className="font-mono font-bold text-lg break-all">{v}</p>
            </div>
            <CopyBtn value={v} label={k} />
          </div>
        ))}
      </div>
      <p className="flex items-start gap-2 text-sm font-medium mt-4">
        <AlertTriangle className="size-4 shrink-0 mt-0.5" />
        Data ini hanya ditampilkan sekali. Sampaikan ke admin melalui kanal
        aman; admin wajib mengganti sandi saat login pertama.
      </p>
    </Panel>
  );
}

function Provision({ onDone, onCancel }) {
  const { createTenant } = useStore();
  const { now } = useClock();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [maxUsers, setMaxUsers] = useState('20');
  const [until, setUntil] = useState(() => addMonthsKey(now, 12));
  const [adminName, setAdminName] = useState('');
  const [adminNik, setAdminNik] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const n = Number(maxUsers);
    if (!Number.isInteger(n) || n < 1) {
      return setError('Maksimal pengguna harus bilangan bulat minimal 1.');
    }
    if (!until || until <= dateKey(now)) {
      return setError('Tanggal aktif sampai harus setelah hari ini.');
    }
    const r = createTenant({
      name,
      code,
      maxUsers: n,
      activeUntil: until,
      adminName,
      adminNik,
    });
    if (!r.ok) return setError(r.error);
    setError('');
    onDone({
      code: r.tenant.code,
      name: r.tenant.name,
      licenseKey: r.tenant.licenseKey,
      nik: adminNik,
      password: r.adminPassword,
    });
  };

  return (
    <Panel
      kicker="Provisioning"
      title="Tenant baru"
      action={
        <Btn variant="ghost" size="sm" onClick={onCancel}>
          <X className="size-4" /> Batal
        </Btn>
      }
    >
      <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
        <Field label="Nama perusahaan">
          <input
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="PT Maju Bersama"
            required
          />
        </Field>
        <Field
          label="Kode perusahaan"
          hint="2–8 huruf/angka, dipakai saat login."
        >
          <input
            className={`${inputCls} font-mono uppercase`}
            value={code}
            onChange={(e) =>
              setCode(
                e.target.value
                  .replace(/[^a-zA-Z0-9]/g, '')
                  .toUpperCase()
                  .slice(0, 8)
              )
            }
            placeholder="MJB"
            required
          />
        </Field>
        <Field label="Maksimal pengguna">
          <input
            className={`${inputCls} tabular-nums`}
            type="number"
            min={1}
            value={maxUsers}
            onChange={(e) => setMaxUsers(e.target.value)}
            required
          />
        </Field>
        <Field label="Aktif sampai" hint="Bawaan: 12 bulan dari hari ini.">
          <input
            className={inputCls}
            type="date"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
            required
          />
        </Field>
        <Field label="Nama admin pertama">
          <input
            className={inputCls}
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            placeholder="Nama lengkap"
            required
          />
        </Field>
        <Field
          label="NIK admin pertama"
          hint="16 digit; unik hanya di dalam tenant ini."
        >
          <input
            className={`${inputCls} font-mono tabular-nums`}
            inputMode="numeric"
            value={adminNik}
            onChange={(e) =>
              setAdminNik(e.target.value.replace(/\D/g, '').slice(0, 16))
            }
            placeholder="16 digit"
            required
          />
        </Field>
        {error && (
          <p
            role="alert"
            className="sm:col-span-2 bg-destructive text-destructive-foreground border-2 border-foreground rounded-md px-4 py-2.5 text-sm font-medium"
          >
            {error}
          </p>
        )}
        <div className="sm:col-span-2 flex justify-end">
          <Btn type="submit">
            <Plus className="size-4" /> Buat tenant
          </Btn>
        </div>
      </form>
    </Panel>
  );
}

function TenantCard({ t, status, active, days }) {
  const { extendLicense, updateTenant } = useStore();
  const [months, setMonths] = useState(12);
  const [confirm, setConfirm] = useState(false);
  const [notice, setNotice] = useState('');
  const pct = Math.round((active / Math.max(1, t.maxUsers)) * 100);

  const toggle = () => {
    const next = !t.suspended;
    updateTenant(
      t.id,
      { suspended: next },
      'Platform Owner',
      next ? 'Tenant ditangguhkan' : 'Tenant diaktifkan'
    );
    setNotice(`${t.name} ${next ? 'ditangguhkan' : 'diaktifkan kembali'}`);
    setTimeout(() => setNotice(''), 2500);
    setConfirm(false);
  };

  return (
    <article className="border-2 border-foreground rounded-md bg-card flex flex-col">
      <header className="flex items-start justify-between gap-3 p-4 border-b-2 border-foreground">
        <div className="min-w-0">
          <span className="font-mono font-bold bg-foreground text-accent px-2 py-0.5 rounded-sm text-sm">
            {t.code}
          </span>
          <h3 className="font-display text-xl font-extrabold leading-tight mt-2">
            {t.name}
          </h3>
        </div>
        <Pill tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Pill>
      </header>
      <dl className="p-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div className="col-span-2">
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Kunci lisensi
          </dt>
          <dd className="font-mono font-bold break-all">{t.licenseKey}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Aktif sampai
          </dt>
          <dd className="tabular-nums font-medium">{fmtDate(t.activeUntil)}</dd>
          <dd className="text-xs text-muted-foreground tabular-nums">
            {days < 0 ? `lewat ${Math.abs(days)} hari` : `${days} hari lagi`}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Dibuat
          </dt>
          <dd className="tabular-nums font-medium">
            {fmtDate(t.createdAt || '2024-01-15')}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground flex justify-between">
            <span>Pengguna aktif</span>
            <span className="tabular-nums normal-case tracking-normal text-foreground">
              {active}/{t.maxUsers}
            </span>
          </dt>
          <dd className="mt-1.5">
            <Meter value={pct} tone={pct >= 90 ? 'dark' : 'accent'} />
          </dd>
        </div>
      </dl>

      <footer className="mt-auto p-4 border-t-2 border-foreground space-y-3">
        {notice && (
          <p className="text-xs font-bold bg-accent/40 border border-foreground rounded px-2.5 py-1.5">
            {notice}
          </p>
        )}
        {confirm ? (
          <div role="alertdialog" aria-label="Konfirmasi" className="space-y-3">
            <p className="text-sm font-medium">
              {t.suspended
                ? `Aktifkan kembali ${t.name}? Semua pengguna dapat login lagi.`
                : `Tangguhkan ${t.name}? Seluruh pengguna tenant ini langsung tidak bisa login.`}
            </p>
            <div className="flex gap-2">
              <Btn
                variant={t.suspended ? 'accent' : 'danger'}
                size="sm"
                onClick={toggle}
              >
                Ya, {t.suspended ? 'aktifkan' : 'tangguhkan'}
              </Btn>
              <Btn variant="ghost" size="sm" onClick={() => setConfirm(false)}>
                Batal
              </Btn>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor={`m-${t.id}`}>
              Durasi perpanjangan {t.name}
            </label>
            <select
              id={`m-${t.id}`}
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="border-2 border-foreground rounded-md bg-card px-2 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {[3, 6, 12].map((m) => (
                <option key={m} value={m}>
                  {m} bulan
                </option>
              ))}
            </select>
            <Btn
              variant="accent"
              size="sm"
              onClick={() => {
                extendLicense(t.id, months);
                setNotice(`Lisensi ${t.code} diperpanjang ${months} bulan`);
                setTimeout(() => setNotice(''), 2500);
              }}
            >
              <RefreshCw className="size-4" /> Perpanjang
            </Btn>
            <Btn
              variant={t.suspended ? 'ghost' : 'danger'}
              size="sm"
              className="ml-auto"
              onClick={() => setConfirm(true)}
            >
              {t.suspended ? (
                <Play className="size-4" />
              ) : (
                <Pause className="size-4" />
              )}
              {t.suspended ? 'Aktifkan' : 'Tangguhkan'}
            </Btn>
          </div>
        )}
      </footer>
    </article>
  );
}

/**
 * SuperTenant - 1:1 dengan figma desain/src/app/component/super/Tenant.tsx
 */
export function SuperTenant() {
  const { tenants, users } = useStore();
  const { now } = useClock();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('semua');
  const [creating, setCreating] = useState(false);
  const [handoff, setHandoff] = useState(null);

  const list = useMemo(
    () =>
      tenants
        .map((t) => ({
          t,
          status: statusOf(t, now),
          days: diffCalendarDays(t.activeUntil, now),
          active: users.filter((u) => u.tenantId === t.id && u.active).length,
        }))
        .filter(
          (r) =>
            (filter === 'semua' || r.status === filter) &&
            `${r.t.code} ${r.t.name} ${r.t.licenseKey}`
              .toLowerCase()
              .includes(q.trim().toLowerCase())
        ),
    [tenants, users, now, q, filter]
  );

  const filters = ['semua', 'aktif', 'kedaluwarsa', 'ditangguhkan'];

  return (
    <div>
      <PageHead
        kicker="Super Admin · manajemen tenant"
        title="Tenant & lisensi"
        action={
          !creating && (
            <Btn
              onClick={() => {
                setCreating(true);
                setHandoff(null);
              }}
            >
              <Plus className="size-4" /> Provisioning tenant baru
            </Btn>
          )
        }
      />

      <div className="flex items-start gap-3 border-2 border-foreground rounded-md bg-foreground text-background p-4 mb-6">
        <Layers className="size-5 shrink-0 mt-0.5 text-accent" />
        <p className="text-sm">
          <span className="font-bold">Satu aplikasi, dijual berkali-kali.</span>{' '}
          Setiap tenant mendapat ruang data terisolasi: seluruh kueri dikunci
          dengan <span className="font-mono">tenant_id</span>, sehingga
          perusahaan satu tidak pernah melihat data perusahaan lain, dan Anda
          sebagai pemilik platform hanya mengelola lisensi, bukan data pribadi
          karyawan.
        </p>
      </div>

      <div className="space-y-6">
        {handoff && (
          <HandoffCard h={handoff} onClose={() => setHandoff(null)} />
        )}
        {creating && (
          <Provision
            onCancel={() => setCreating(false)}
            onDone={(h) => {
              setHandoff(h);
              setCreating(false);
            }}
          />
        )}

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex-1 min-w-[220px] flex items-center gap-2 border-2 border-foreground rounded-md bg-card px-3 py-2 focus-within:shadow-[4px_4px_0_0_#c9f23c] transition-shadow">
            <Search className="size-4 text-muted-foreground" />
            <span className="sr-only">Cari tenant</span>
            <input
              className={inputCls}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari kode, nama, atau kunci lisensi"
            />
          </label>
          <div
            className="flex gap-1.5 overflow-x-auto no-scrollbar"
            role="group"
            aria-label="Filter status"
          >
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={`font-mono text-[11px] uppercase tracking-wider px-3 py-2 rounded-md border-2 border-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer ${
                  filter === f
                    ? 'bg-foreground text-accent'
                    : 'bg-card hover:bg-secondary'
                }`}
              >
                {f === 'semua' ? 'Semua' : STATUS_LABEL[f]}
              </button>
            ))}
          </div>
        </div>

        {list.length === 0 ? (
          <Empty
            icon={<Search className="size-8" />}
            title="Tidak ada tenant yang cocok"
            text="Ubah kata kunci pencarian atau filter status."
          />
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {list.map((r) => (
              <TenantCard key={r.t.id} {...r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SuperTenant;
