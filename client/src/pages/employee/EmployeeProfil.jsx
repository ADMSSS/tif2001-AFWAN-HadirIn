import React, { useMemo, useState } from 'react';
import {
  Building2,
  Eye,
  EyeOff,
  History,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import {
  dateKey,
  fmtDate,
  inputCls,
  maskNik,
  summarize,
  useClock,
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

export function EmployeeProfil({ session }) {
  const {
    users,
    tenants,
    attendances,
    journals,
    consents,
    changePassword,
    respondConsent,
  } = useStore();
  const { now } = useClock();

  const baseUser =
    users.find((u) => u.id === session.userId) ||
    users.find((u) => u.nik === session.nik) ||
    users[0];

  const user = useMemo(
    () =>
      baseUser
        ? {
            ...baseUser,
            fullName: session.name || baseUser.fullName,
            nik: session.nik || baseUser.nik,
            position: session.position || baseUser.position,
          }
        : null,
    [baseUser, session.name, session.nik, session.position]
  );

  const tenant = tenants.find((t) => t.id === session.tenantId) || tenants[0];

  const [showNik, setShowNik] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [repeat, setRepeat] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const mine = useMemo(
    () => consents.filter((c) => c.nik === user?.nik),
    [consents, user?.nik]
  );
  const pending = mine.filter((c) => c.status === 'PENDING');
  const decided = mine
    .filter((c) => c.status !== 'PENDING')
    .sort((a, b) =>
      (a.decidedAt ?? a.createdAt) < (b.decidedAt ?? b.createdAt) ? 1 : -1
    );

  const career = useMemo(() => {
    if (!user) return [];
    const today = dateKey(now);
    const matchingUsers = users.filter((u) => u.nik === user.nik);
    const list = matchingUsers.length > 0 ? matchingUsers : [user];
    return list
      .map((u) => {
        const to = u.leftAt ?? today;
        const s = summarize(
          attendances.filter((a) => a.userId === u.id),
          journals.filter((j) => j.userId === u.id),
          u.joinedAt,
          to
        );
        return {
          u,
          company: tenants.find((t) => t.id === u.tenantId) || tenant,
          to,
          pct: s.pctHadir,
        };
      })
      .sort((a, b) => (a.u.joinedAt < b.u.joinedAt ? 1 : -1));
  }, [users, user, attendances, journals, tenants, tenant, now]);

  if (!user || !tenant) return null;

  const submitPw = (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (user.password && oldPw !== user.password) {
      setPwError('Sandi lama tidak sesuai.');
      return;
    }
    if (newPw.length < 8 || !/[A-Za-z]/.test(newPw) || !/\d/.test(newPw)) {
      setPwError(
        'Sandi baru minimal 8 karakter dan memuat huruf serta angka.'
      );
      return;
    }
    if (newPw === oldPw) {
      setPwError('Sandi baru tidak boleh sama dengan sandi lama.');
      return;
    }
    if (newPw !== repeat) {
      setPwError('Pengulangan sandi tidak cocok.');
      return;
    }
    if (changePassword) {
      changePassword(user.id, newPw);
    }
    setPwSuccess('Sandi berhasil diganti.');
    setOldPw('');
    setNewPw('');
    setRepeat('');
  };

  const requester = (id) =>
    tenants.find((t) => t.id === id)?.name ?? 'Perusahaan tidak dikenal';

  return (
    <div>
      <PageHead kicker="Akun saya" title="Profil" />

      <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
        <div className="space-y-6">
          {pending.length > 0 && (
            <section aria-label="Permintaan persetujuan" className="space-y-4">
              {pending.map((c) => (
                <article
                  key={c.id}
                  className="border-2 border-foreground rounded-md bg-accent text-accent-foreground p-5 shadow-[6px_6px_0_0_var(--foreground)]"
                >
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] opacity-70 flex items-center gap-2">
                    <ShieldCheck size={14} /> Menunggu keputusan Anda
                  </p>
                  <h3 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight mt-2">
                    {requester(c.requesterTenantId)} meminta akses rekam jejak
                    Anda
                  </h3>
                  <p className="mt-2 text-sm">
                    Diminta oleh <b>{c.requestedBy}</b> pada{' '}
                    {fmtDate(c.createdAt, 'd MMMM yyyy, HH:mm')}.
                  </p>
                  <p className="mt-3 text-sm bg-card/60 border-2 border-foreground rounded-md p-3">
                    Jika disetujui, perusahaan tersebut hanya melihat{' '}
                    <b>agregat kehadiran dan kedisiplinan</b> (persentase hadir,
                    ketepatan waktu, jumlah jurnal). Foto presensi, lokasi, dan
                    isi jurnal <b>tidak</b> ikut terlihat. Anda berhak menolak
                    tanpa konsekuensi pada pekerjaan Anda saat ini.
                  </p>
                  <div className="flex flex-wrap gap-3 mt-4">
                    <Btn
                      onClick={() => {
                        if (respondConsent) respondConsent(c.id, true);
                      }}
                    >
                      Approve Access
                    </Btn>
                    <Btn
                      variant="ghost"
                      onClick={() => {
                        if (respondConsent) respondConsent(c.id, false);
                      }}
                    >
                      Tolak
                    </Btn>
                  </div>
                </article>
              ))}
            </section>
          )}

          <section className="border-2 border-foreground rounded-md bg-card p-6 flex flex-wrap gap-5 items-center">
            <Avatar name={user.fullName} size={84} />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-3xl font-extrabold tracking-tight leading-tight">
                {user.fullName}
              </h2>
              <p className="font-bold">{user.position}</p>
              <p className="text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Building2 size={14} /> {tenant.name}{' '}
                <span className="font-mono text-xs">· {tenant.code}</span>
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-3 w-full sm:w-auto">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  NIK
                </dt>
                <dd className="font-mono tabular-nums flex items-center gap-2">
                  {showNik ? user.nik : maskNik(user.nik)}
                  <button
                    type="button"
                    onClick={() => setShowNik((v) => !v)}
                    aria-label={showNik ? 'Sembunyikan NIK' : 'Tampilkan NIK'}
                    aria-pressed={showNik}
                    className="p-1 rounded-sm border-2 border-foreground hover:bg-accent focus-visible:outline-2 cursor-pointer"
                  >
                    {showNik ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Bergabung
                </dt>
                <dd className="tabular-nums">
                  {fmtDate(user.joinedAt, 'd MMMM yyyy')}
                </dd>
              </div>
            </dl>
          </section>

          <Panel
            title="Rekam jejak karier saya"
            kicker="Lintas perusahaan · NIK sama"
            bodyClassName="p-0"
          >
            <ul className="divide-y-2 divide-foreground/15">
              {career.map(({ u, company, to, pct }) => (
                <li
                  key={u.id}
                  className="p-5 flex flex-wrap items-center gap-x-6 gap-y-3"
                >
                  <div className="flex-1 min-w-[200px]">
                    <p className="font-display text-lg font-extrabold leading-tight flex flex-wrap items-center gap-2">
                      {company?.name ?? '—'}
                      {!u.leftAt && <Pill tone="ok">Aktif</Pill>}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {u.position}
                    </p>
                    <p className="text-xs font-mono text-muted-foreground tabular-nums mt-1">
                      {fmtDate(u.joinedAt, 'MMM yyyy')} –{' '}
                      {u.leftAt ? fmtDate(to, 'MMM yyyy') : 'sekarang'}
                    </p>
                  </div>
                  <div className="w-44">
                    <p className="font-display text-2xl font-extrabold tabular-nums leading-none">
                      {pct}%
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5">
                      Kehadiran
                    </p>
                    <Meter value={pct} tone="accent" />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel title="Ganti sandi" kicker="Keamanan">
            <form onSubmit={submitPw} className="space-y-4">
              <Field label="Sandi lama">
                <input
                  type="password"
                  className={inputCls}
                  value={oldPw}
                  onChange={(e) => setOldPw(e.target.value)}
                  autoComplete="current-password"
                />
              </Field>
              <Field
                label="Sandi baru"
                hint="Minimal 8 karakter, kombinasi huruf dan angka."
              >
                <input
                  type="password"
                  className={inputCls}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  autoComplete="new-password"
                />
              </Field>
              <Field label="Ulangi sandi baru">
                <input
                  type="password"
                  className={inputCls}
                  value={repeat}
                  onChange={(e) => setRepeat(e.target.value)}
                  autoComplete="new-password"
                />
              </Field>
              {pwError && (
                <p
                  role="alert"
                  className="border-2 border-foreground rounded-md bg-destructive text-destructive-foreground px-3 py-2 text-sm font-bold"
                >
                  {pwError}
                </p>
              )}
              {pwSuccess && (
                <p
                  role="status"
                  className="border-2 border-foreground rounded-md bg-accent text-foreground px-3 py-2 text-sm font-bold"
                >
                  {pwSuccess}
                </p>
              )}
              <Btn
                type="submit"
                disabled={!oldPw || !newPw || !repeat}
                className="w-full"
              >
                <KeyRound size={16} /> Simpan sandi
              </Btn>
            </form>
          </Panel>

          <Panel title="Persetujuan akses (UU PDP)" kicker="Riwayat keputusan">
            <p className="text-sm text-muted-foreground mb-4">
              Perusahaan lain hanya dapat melihat agregat kehadiran Anda setelah
              Anda setuju. Keputusan tercatat di bawah ini.
            </p>
            {mine.length === 0 ? (
              <Empty
                icon={<ShieldCheck size={26} />}
                title="Belum ada permintaan"
                text="Anda akan diberi tahu saat perusahaan lain meminta akses."
              />
            ) : decided.length === 0 ? (
              <p className="text-sm font-bold">
                Hanya ada permintaan yang menunggu keputusan di bagian atas
                halaman.
              </p>
            ) : (
              <ul className="space-y-3">
                {decided.map((c) => (
                  <li
                    key={c.id}
                    className="border-2 border-foreground rounded-md p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold leading-tight">
                        {requester(c.requesterTenantId)}
                      </p>
                      <Pill tone={c.status === 'APPROVED' ? 'ok' : 'warn'}>
                        {c.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                      </Pill>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 tabular-nums">
                      <History size={12} /> Diminta{' '}
                      {fmtDate(c.createdAt, 'd MMM yyyy')}
                      {c.decidedAt &&
                        ` · diputuskan ${fmtDate(c.decidedAt, 'd MMM yyyy')}`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}

export default EmployeeProfil;
