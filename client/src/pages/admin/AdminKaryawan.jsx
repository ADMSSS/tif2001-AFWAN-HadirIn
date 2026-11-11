import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Eye,
  KeyRound,
  Lock,
  Search,
  ShieldAlert,
  UserCheck,
  UserPlus,
  UserX,
  X,
} from 'lucide-react';
import {
  addDaysDate,
  dateKey,
  diffMinutes,
  fmtDate,
  fmtTime,
  hm,
  inputCls,
  maskNik,
  summarize,
  useClock,
  useScoped,
  useStore,
} from '../../utils/formatters';
import {
  Avatar,
  Btn,
  Empty,
  Field,
  Meter,
  PageHead,
  Panel,
  Pill,
} from '../../components/ui';

const FILTERS = [
  ['semua', 'Semua'],
  ['aktif', 'Aktif'],
  ['wajib', 'Wajib ganti sandi'],
  ['nonaktif', 'Nonaktif'],
];

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }
}

function CopyRow({ label, value }) {
  const [done, setDone] = useState(false);
  const click = async () => {
    const ok = await copyText(value);
    if (ok) {
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    }
  };
  return (
    <div className="flex items-center gap-3 border-2 border-background/40 rounded-md px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-60">
          {label}
        </p>
        <p className="font-mono text-lg tabular-nums break-all select-all">
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={click}
        aria-label={`Salin ${label}`}
        className="shrink-0 size-9 grid place-items-center rounded-md border-2 border-background bg-accent text-accent-foreground hover:bg-background transition-colors cursor-pointer"
      >
        {done ? <Check className="size-4" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}

export function AdminKaryawan({ session }) {
  const tenantId = session.tenantId;
  const { tenant, users, attendances, journals } = useScoped(tenantId);
  const { createEmployee, resetPassword, setUserActive } = useStore();
  const { now } = useClock();

  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('semua');
  const [nik, setNik] = useState('');
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [error, setError] = useState('');
  const [cred, setCred] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const staff = useMemo(
    () => users.filter((u) => u.role === 'karyawan'),
    [users]
  );
  const activeCount = users.filter((u) => u.active).length;
  const full = activeCount >= tenant.maxUsers;
  const today = dateKey(now);
  const from = dateKey(addDaysDate(now, -29));

  const perf = useMemo(() => {
    const m = new Map();
    staff.forEach((u) =>
      m.set(
        u.id,
        summarize(
          attendances.filter((a) => a.userId === u.id),
          journals.filter((j) => j.userId === u.id),
          from < u.joinedAt ? u.joinedAt : from,
          today
        )
      )
    );
    return m;
  }, [staff, attendances, journals, from, today]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return staff
      .filter((u) => {
        if (filter === 'aktif' && !(u.active && !u.mustChangePassword))
          return false;
        if (filter === 'nonaktif' && u.active) return false;
        if (filter === 'wajib' && !(u.active && u.mustChangePassword))
          return false;
        return (
          !needle ||
          u.fullName.toLowerCase().includes(needle) ||
          u.position.toLowerCase().includes(needle) ||
          u.nik.includes(needle)
        );
      })
      .sort(
        (a, b) =>
          Number(b.active) - Number(a.active) ||
          a.fullName.localeCompare(b.fullName, 'id')
      );
  }, [staff, q, filter]);

  const submit = (e) => {
    e.preventDefault();
    const res = createEmployee(
      tenantId,
      { nik: nik.trim(), fullName, position },
      session.name
    );
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setError('');
    setCred({
      name: res.user.fullName,
      nik: res.user.nik,
      password: res.user.password,
      kind: 'baru',
    });
    setNik('');
    setFullName('');
    setPosition('');
  };

  const runConfirm = () => {
    if (!confirm) return;
    const { user, action } = confirm;
    if (action === 'reset') {
      const password = resetPassword(user.id, session.name);
      setCred({
        name: user.fullName,
        nik: user.nik,
        password,
        kind: 'reset',
      });
    } else {
      setUserActive(user.id, action === 'aktif', session.name);
    }
    setConfirm(null);
  };

  const detail = detailId ? staff.find((u) => u.id === detailId) : undefined;
  const detailPerf = detail ? perf.get(detail.id) : undefined;
  const detailAtt = detail
    ? attendances
        .filter((a) => a.userId === detail.id)
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, 10)
    : [];

  return (
    <div>
      <PageHead
        kicker={tenant.name}
        title="Karyawan"
        action={
          <div className="min-w-48">
            <p className="font-display text-3xl font-extrabold tabular-nums leading-none text-right">
              {activeCount}
              <span className="text-lg text-muted-foreground">
                {' '}
                / {tenant.maxUsers}
              </span>
            </p>
            <div className="mt-2">
              <Meter
                value={(activeCount / tenant.maxUsers) * 100}
                tone={full ? 'dark' : 'accent'}
              />
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1.5 text-right">
              Kuota lisensi terpakai
            </p>
          </div>
        }
      />

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6 items-start">
        <div className="min-w-0 space-y-4 order-2 lg:order-1">
          <div className="flex flex-wrap gap-3">
            <label className="flex-1 min-w-56 flex items-center gap-2 border-2 border-foreground rounded-md bg-card px-3 py-2 focus-within:shadow-[4px_4px_0_0_#c9f23c] transition-shadow">
              <Search className="size-4 text-muted-foreground" aria-hidden />
              <span className="sr-only">Cari karyawan</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari nama, jabatan, atau NIK"
                className={inputCls}
              />
            </label>
            <div
              role="group"
              aria-label="Filter status"
              className="flex border-2 border-foreground rounded-md overflow-x-auto no-scrollbar"
            >
              {FILTERS.map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={filter === k}
                  onClick={() => setFilter(k)}
                  className={`px-3 py-2 font-mono text-[11px] uppercase tracking-widest whitespace-nowrap transition-colors cursor-pointer ${
                    filter === k
                      ? 'bg-foreground text-accent'
                      : 'bg-card hover:bg-secondary'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {list.length === 0 ? (
            <Empty
              icon={<Search className="size-8" />}
              title="Tidak ada karyawan yang cocok"
              text="Ubah kata kunci atau filter status."
            />
          ) : (
            <ul className="grid sm:grid-cols-2 gap-3">
              {list.map((u) => {
                const p = perf.get(u.id);
                return (
                  <li
                    key={u.id}
                    className={`border-2 border-foreground rounded-md p-4 ${
                      u.active ? 'bg-card' : 'bg-secondary/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={u.active ? '' : 'opacity-50'}>
                        <Avatar name={u.fullName} size={44} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-display font-extrabold leading-tight truncate">
                          {u.fullName}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {u.position}
                        </p>
                        <p className="font-mono text-xs tabular-nums mt-1">
                          {maskNik(u.nik)}
                        </p>
                      </div>
                      {!u.active ? (
                        <Pill tone="mute">Nonaktif</Pill>
                      ) : u.mustChangePassword ? (
                        <Pill tone="warn">Wajib ganti sandi</Pill>
                      ) : (
                        <Pill tone="ok">Aktif</Pill>
                      )}
                    </div>
                    <div className="mt-4">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground flex justify-between">
                        <span>Hadir 30 hari</span>
                        <span className="tabular-nums text-foreground">
                          {p?.pctHadir ?? 0}%
                        </span>
                      </p>
                      <Meter value={p?.pctHadir ?? 0} />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Btn
                        size="sm"
                        variant="ghost"
                        onClick={() => setDetailId(u.id)}
                      >
                        <Eye className="size-4" />
                        Detail
                      </Btn>
                      {u.active && (
                        <Btn
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setConfirm({ user: u, action: 'reset' })
                          }
                        >
                          <KeyRound className="size-4" />
                          Reset sandi
                        </Btn>
                      )}
                      {u.active ? (
                        <Btn
                          size="sm"
                          variant="danger"
                          onClick={() =>
                            setConfirm({ user: u, action: 'nonaktif' })
                          }
                        >
                          <UserX className="size-4" />
                          Nonaktifkan
                        </Btn>
                      ) : (
                        <Btn
                          size="sm"
                          variant="accent"
                          disabled={full}
                          title={full ? 'Kuota lisensi penuh' : undefined}
                          onClick={() =>
                            setConfirm({ user: u, action: 'aktif' })
                          }
                        >
                          <UserCheck className="size-4" />
                          Aktifkan
                        </Btn>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="space-y-6 order-1 lg:order-2 lg:sticky lg:top-6 min-w-0">
          {cred && (
            <Panel
              tone="dark"
              kicker={cred.kind === 'baru' ? 'Akun dibuat' : 'Sandi direset'}
              title="Kredensial awal"
              bodyClassName="p-5 space-y-3"
            >
              <p className="text-sm opacity-80">
                Berikan kepada <b>{cred.name}</b>. Login memakai kode
                perusahaan, NIK, dan sandi di bawah.
              </p>
              <CopyRow label="Kode perusahaan" value={tenant.code} />
              <CopyRow label="NIK" value={cred.nik} />
              <CopyRow label="Sandi awal" value={cred.password} />
              <div className="flex gap-2.5 items-start border-2 border-accent rounded-md p-3 text-sm">
                <ShieldAlert className="size-4 mt-0.5 shrink-0 text-accent" />
                <p>
                  Karyawan wajib mengganti sandi saat login pertama. Sandi ini
                  hanya ditampilkan sekali dan tidak dapat dilihat lagi setelah
                  kartu ditutup.
                </p>
              </div>
              <Btn variant="accent" size="sm" onClick={() => setCred(null)}>
                Saya sudah menyalin, tutup
              </Btn>
            </Panel>
          )}

          <Panel title="Tambah karyawan" kicker="Akun baru" bodyClassName="p-5">
            <form onSubmit={submit} className="space-y-4" noValidate>
              <Field label="NIK (16 digit)">
                <input
                  value={nik}
                  onChange={(e) =>
                    setNik(e.target.value.replace(/\D/g, '').slice(0, 16))
                  }
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="3173010101900001"
                  aria-invalid={!!error}
                  className={`${inputCls} font-mono tabular-nums`}
                />
              </Field>
              <Field label="Nama lengkap">
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama sesuai KTP"
                  className={inputCls}
                />
              </Field>
              <Field label="Jabatan">
                <input
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Contoh: Staf Gudang"
                  className={inputCls}
                />
              </Field>
              {error && (
                <p
                  role="alert"
                  className="border-2 border-foreground bg-destructive text-destructive-foreground rounded-md px-3 py-2 text-sm font-bold"
                >
                  {error}
                </p>
              )}
              {full && !error && (
                <p className="text-sm text-muted-foreground">
                  Kuota lisensi penuh ({tenant.maxUsers} pengguna). Nonaktifkan
                  akun lain atau hubungi penyedia platform.
                </p>
              )}
              <Btn
                type="submit"
                className="w-full"
                disabled={!nik || !fullName.trim()}
              >
                <UserPlus className="size-4" />
                Buat akun
              </Btn>
            </form>
          </Panel>
        </div>
      </div>

      {/* Modal Konfirmasi Reset Sandi / Nonaktifkan / Aktifkan */}
      {confirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-foreground/70 grid place-items-center p-4"
        >
          <div className="w-full max-w-md border-2 border-foreground rounded-md bg-card p-6 shadow-[8px_8px_0_0_#111611]">
            <h2 className="font-display text-2xl font-extrabold">
              {confirm.action === 'reset'
                ? 'Reset sandi?'
                : confirm.action === 'nonaktif'
                  ? 'Nonaktifkan akun?'
                  : 'Aktifkan kembali?'}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              {confirm.action === 'reset' &&
                `Sandi baru acak dibuat untuk ${confirm.user.fullName}; sandi lama tidak berlaku dan karyawan wajib menggantinya saat login.`}
              {confirm.action === 'nonaktif' &&
                `${confirm.user.fullName} tidak bisa login lagi. Riwayat presensi dan jurnal tetap tersimpan, dan kuota lisensi dibebaskan.`}
              {confirm.action === 'aktif' &&
                `${confirm.user.fullName} dapat login kembali dan akan memakai satu kuota lisensi.`}
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <Btn variant="ghost" onClick={() => setConfirm(null)}>
                Batal
              </Btn>
              <Btn
                variant={confirm.action === 'nonaktif' ? 'danger' : 'primary'}
                onClick={runConfirm}
              >
                Ya, lanjutkan
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* Slide-Over Detail Karyawan (Sheet) */}
      {detail && detailPerf && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-foreground/60 flex justify-end"
          onClick={() => setDetailId(null)}
        >
          <div
            className="w-full sm:max-w-md h-full border-l-2 border-foreground bg-background overflow-y-auto no-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative p-5 border-b-2 border-foreground bg-card">
              <button
                type="button"
                onClick={() => setDetailId(null)}
                aria-label="Tutup detail"
                className="absolute top-4 right-4 size-8 rounded-md border-2 border-foreground grid place-items-center hover:bg-secondary cursor-pointer"
              >
                <X className="size-4" />
              </button>
              <div className="flex items-center gap-3 pr-8">
                <Avatar name={detail.fullName} size={48} />
                <div className="min-w-0">
                  <h2 className="font-display text-2xl font-extrabold leading-tight">
                    {detail.fullName}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {detail.position} ·{' '}
                    <span className="font-mono tabular-nums">
                      {maskNik(detail.nik)}
                    </span>
                  </p>
                </div>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-2">
                Bergabung {fmtDate(detail.joinedAt)}
                {detail.leftAt ? ` · nonaktif ${fmtDate(detail.leftAt)}` : ''}
              </p>
            </div>

            <div className="p-5 space-y-6">
              <section>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
                  Performa 30 hari
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    [
                      'Kehadiran',
                      `${detailPerf.pctHadir}%`,
                      `${detailPerf.hadir} dari ${detailPerf.workdays} hari`,
                    ],
                    [
                      'Tepat waktu',
                      `${detailPerf.pctTepat}%`,
                      `${detailPerf.terlambat} kali terlambat`,
                    ],
                    ['Jam kerja', `${detailPerf.jam}`, 'jam tercatat'],
                    [
                      'Jurnal disetujui',
                      `${detailPerf.jurnalOk}`,
                      `dari ${detailPerf.jurnal} jurnal`,
                    ],
                  ].map(([l, v, h]) => (
                    <div
                      key={l}
                      className="border-2 border-foreground rounded-md bg-card p-3"
                    >
                      <p className="font-display text-3xl font-extrabold tabular-nums leading-none">
                        {v}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-widest mt-2">
                        {l}
                      </p>
                      <p className="text-xs text-muted-foreground">{h}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
                  10 presensi terakhir
                </p>
                {detailAtt.length === 0 ? (
                  <Empty title="Belum ada presensi" />
                ) : (
                  <ul className="border-2 border-foreground rounded-md bg-card divide-y-2 divide-foreground/10">
                    {detailAtt.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm"
                      >
                        <Lock
                          className="size-3.5 text-muted-foreground shrink-0"
                          aria-label="Terkunci"
                        />
                        <span className="w-24 shrink-0 tabular-nums">
                          {fmtDate(a.date, 'EEE d MMM')}
                        </span>
                        <span className="font-mono tabular-nums flex-1">
                          {fmtTime(a.checkIn)} – {fmtTime(a.checkOut)}
                          {a.checkOut && (
                            <span className="text-muted-foreground">
                              {' '}
                              · {hm(diffMinutes(a.checkOut, a.checkIn))}
                            </span>
                          )}
                        </span>
                        <Pill tone={a.status === 'tepat' ? 'ok' : 'warn'}>
                          {a.status === 'tepat' ? 'Tepat' : 'Terlambat'}
                        </Pill>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminKaryawan;
