import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarOff,
  CheckCircle2,
  Clock,
  Fingerprint,
  MapPin,
  NotebookPen,
  ShieldCheck,
  Timer,
} from 'lucide-react';
import {
  summarize,
  useClock,
  useStore,
  dateKey,
  diffMinutes,
  fmtDate,
  fmtTime,
  hm,
  isWeekendDate,
} from '../../utils/formatters';
import { Btn, PageHead, Panel, Pill, Stat } from '../../components/ui';

const CELL_CLS = {
  tepat: 'bg-accent border-foreground',
  terlambat: 'bg-destructive border-foreground',
  alpa: 'bg-card border-foreground',
  libur: 'bg-secondary border-transparent opacity-60',
  belum: 'bg-card border-dashed border-foreground/50',
  pra: 'bg-transparent border-transparent',
};

const CELL_LABEL = {
  tepat: 'hadir tepat waktu',
  terlambat: 'hadir terlambat',
  alpa: 'tidak hadir',
  libur: 'akhir pekan',
  belum: 'belum presensi',
  pra: 'sebelum bergabung',
};

function Banner({ tone, icon, title, text, cta, onClick }) {
  const bg =
    tone === 'warn'
      ? 'bg-destructive text-destructive-foreground'
      : tone === 'accent'
        ? 'bg-accent text-accent-foreground'
        : 'bg-foreground text-background';
  return (
    <div
      role="status"
      className={`border-2 border-foreground rounded-md px-5 py-4 flex flex-wrap items-center gap-4 ${bg}`}
    >
      <span className="shrink-0">{icon}</span>
      <div className="flex-1 min-w-[220px]">
        <p className="font-display font-extrabold text-lg leading-tight">
          {title}
        </p>
        <p className="text-sm opacity-85 mt-0.5">{text}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1.5 font-display font-bold underline underline-offset-4 decoration-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer"
      >
        {cta} <ArrowRight size={16} />
      </button>
    </div>
  );
}

export function EmployeeDashboard({ session, onNavigate }) {
  const {
    users,
    tenants,
    attendances,
    journals,
    consents,
    canCheckIn,
    canCheckOut,
  } = useStore();
  const { now } = useClock();

  const user = users.find((u) => u.id === session.userId);
  const tenant = tenants.find((t) => t.id === session.tenantId);

  const key = dateKey(now);
  const mine = useMemo(
    () => attendances.filter((a) => a.userId === session.userId),
    [attendances, session.userId]
  );
  const myJournals = useMemo(
    () => journals.filter((j) => j.userId === session.userId),
    [journals, session.userId]
  );

  if (!user || !tenant) return null;

  const today = mine.find((a) => a.date === key);
  const inCheck = canCheckIn(user.id);
  const outCheck = canCheckOut(user.id);

  const startOfCurMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const stats = summarize(mine, myJournals, dateKey(startOfCurMonth), key);

  const rejected = myJournals.filter((j) => j.review === 'ditolak');
  const needJournal =
    Boolean(today) && !myJournals.some((j) => j.attendanceId === today.id);
  const pendingConsents = consents.filter(
    (c) => c.nik === user.nik && c.status === 'PENDING'
  );

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    d.setDate(d.getDate() - (29 - i));
    const k = dateKey(d);
    const att = mine.find((a) => a.date === k);
    let cell;
    if (k < user.joinedAt) cell = 'pra';
    else if (att) cell = att.status;
    else if (isWeekendDate(d)) cell = 'libur';
    else if (k === key) cell = 'belum';
    else cell = 'alpa';
    return { d, k, cell };
  });

  const greet =
    now.getHours() < 11
      ? 'Selamat pagi'
      : now.getHours() < 15
        ? 'Selamat siang'
        : now.getHours() < 18
          ? 'Selamat sore'
          : 'Selamat malam';
  const firstName = user.fullName.split(' ')[0];
  const running =
    today && !today.checkOut ? diffMinutes(now, today.checkIn) : 0;
  const weekend = isWeekendDate(now);

  return (
    <div>
      <PageHead
        kicker={fmtDate(now, 'EEEE, d MMMM yyyy')}
        kickerClassName="lg:hidden"
        title={`${greet}, ${firstName}`}
      />

      <div className="space-y-3 mb-6 empty:hidden">
        {rejected.length > 0 && (
          <Banner
            tone="warn"
            icon={<AlertTriangle size={20} />}
            title={`${rejected.length} jurnal ditolak admin`}
            text={`“${rejected[0].title}” perlu direvisi sebelum bisa disetujui.`}
            cta="Revisi jurnal"
            onClick={() => onNavigate('jurnal')}
          />
        )}
        {needJournal && (
          <Banner
            tone="accent"
            icon={<NotebookPen size={20} />}
            title="Jurnal hari ini belum diisi"
            text="Anda sudah presensi masuk. Catat capaian kerja sebelum jam kerja berakhir."
            cta="Isi jurnal"
            onClick={() => onNavigate('jurnal')}
          />
        )}
        {pendingConsents.length > 0 && (
          <Banner
            tone="dark"
            icon={<ShieldCheck size={20} />}
            title={`${pendingConsents.length} permintaan akses rekam jejak menunggu keputusan Anda`}
            text="Perusahaan lain meminta melihat ringkasan kehadiran Anda. Data baru terbuka setelah Anda setuju."
            cta="Lihat di Profil"
            onClick={() => onNavigate('profil')}
          />
        )}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <div className="space-y-6">
          <section
            className={`border-2 border-foreground rounded-md p-6 ${
              today && !today.checkOut
                ? 'bg-foreground text-background'
                : today
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-card'
            }`}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] opacity-70">
              Status hari ini
            </p>

            {today && !today.checkOut && (
              <div className="mt-2">
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
                  Bekerja sejak{' '}
                  <span className="tabular-nums text-accent">
                    {fmtTime(today.checkIn)}
                  </span>
                </h2>
                <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="inline-flex items-center gap-1.5 tabular-nums">
                    <Timer size={16} /> Berjalan {hm(running)}
                  </span>
                  <Pill tone={today.status === 'tepat' ? 'ok' : 'warn'}>
                    {today.status === 'tepat' ? 'Tepat waktu' : 'Terlambat'}
                  </Pill>
                </p>
                <p className="mt-3 text-sm opacity-80">
                  {outCheck.ok
                    ? 'Jam kerja selesai. Anda bisa presensi pulang sekarang.'
                    : outCheck.reason}
                </p>

                {/* Jika jam kerja selesai & jurnal sudah diisi -> tombol Presensi pulang */}
                {outCheck.ok && (
                  <Btn
                    variant="accent"
                    className="mt-5"
                    onClick={() => onNavigate('presensi')}
                  >
                    Presensi pulang <ArrowRight size={18} />
                  </Btn>
                )}

                {/* Jika sudah lewat jam kerja (sore >= 17:00) tetapi jurnal belum diisi -> wajib isi jurnal dulu */}
                {!outCheck.ok && outCheck.code === 'NEED_JOURNAL_FIRST' && (
                  <Btn
                    variant="accent"
                    className="mt-5"
                    onClick={() => onNavigate('jurnal')}
                  >
                    <NotebookPen size={18} /> Isi jurnal sebelum pulang{' '}
                    <ArrowRight size={18} />
                  </Btn>
                )}
              </div>
            )}

            {today && today.checkOut && (
              <div className="mt-2">
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight flex items-center gap-3">
                  <CheckCircle2 size={34} /> Presensi hari ini selesai
                </h2>
                <p className="mt-2 tabular-nums">
                  Masuk {fmtTime(today.checkIn)} · Pulang{' '}
                  {fmtTime(today.checkOut)} · Durasi{' '}
                  {hm(diffMinutes(today.checkOut, today.checkIn))}
                </p>
                <Btn
                  variant="ghost"
                  className="mt-5"
                  onClick={() => onNavigate('presensi')}
                >
                  Lihat ringkasan
                </Btn>
              </div>
            )}

            {!today && inCheck.ok && (
              <div className="mt-2">
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
                  Anda belum presensi
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Presensi masuk sudah dibuka. Siapkan lokasi aktif, kode QR
                  kantor, dan kamera depan.
                </p>
                <Btn className="mt-5" onClick={() => onNavigate('presensi')}>
                  <Fingerprint size={18} /> Mulai presensi masuk
                </Btn>
              </div>
            )}

            {!today && !inCheck.ok && (
              <div className="mt-2 flex items-start gap-4">
                {weekend ? (
                  <CalendarOff size={34} className="shrink-0 mt-1" />
                ) : (
                  <Clock size={34} className="shrink-0 mt-1" />
                )}
                <div>
                  <h2 className="font-display text-3xl font-extrabold tracking-tight">
                    {weekend ? 'Akhir pekan' : 'Presensi belum tersedia'}
                  </h2>
                  <p className="mt-2 text-muted-foreground">{inCheck.reason}</p>
                  <Btn
                    variant="ghost"
                    size="sm"
                    className="mt-4"
                    onClick={() => onNavigate('presensi')}
                  >
                    Detail presensi
                  </Btn>
                </div>
              </div>
            )}
          </section>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
              Bulan berjalan · {fmtDate(now, 'MMMM yyyy')}
            </p>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <Stat
                label="Kehadiran"
                value={`${stats.pctHadir}%`}
                hint={`${stats.hadir} dari ${stats.workdays} hari kerja`}
                tone="accent"
              />
              <Stat
                label="Tepat waktu"
                value={`${stats.pctTepat}%`}
                hint={`${stats.terlambat} kali terlambat`}
              />
              <Stat
                label="Total jam"
                value={stats.jam}
                hint="jam kerja tercatat"
              />
              <Stat
                label="Jurnal disetujui"
                value={`${stats.jurnalOk}/${stats.jurnal}`}
                hint="bulan ini"
                tone="dark"
              />
            </div>
          </div>

          <Panel title="30 hari terakhir" kicker="Kalender kehadiran">
            <div
              className="grid gap-1.5"
              style={{ gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}
              role="list"
              aria-label="Kalender kehadiran 30 hari terakhir"
            >
              {days.map(({ d, k, cell }) => (
                <div
                  key={k}
                  role="listitem"
                  title={`${fmtDate(d, 'EEE d MMM')} · ${CELL_LABEL[cell]}`}
                  aria-label={`${fmtDate(d, 'd MMMM')}: ${CELL_LABEL[cell]}`}
                  className={`aspect-square rounded-sm border-2 grid place-items-center font-mono text-[10px] tabular-nums ${
                    CELL_CLS[cell]
                  } ${
                    k === key
                      ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card'
                      : ''
                  }`}
                >
                  {fmtDate(d, 'd')}
                </div>
              ))}
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 mt-5 text-xs">
              {['tepat', 'terlambat', 'alpa', 'libur', 'belum'].map((c) => (
                <li key={c} className="flex items-center gap-2">
                  <span
                    className={`size-4 rounded-sm border-2 ${CELL_CLS[c]}`}
                  />
                  <span className="capitalize">{CELL_LABEL[c]}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel
            title="Tempat kerja"
            kicker="Perusahaan"
            bodyClassName="p-5 space-y-4"
          >
            <div>
              <p className="font-display text-xl font-extrabold leading-tight">
                {tenant.name}
              </p>
              <p className="font-mono text-xs text-muted-foreground mt-1">
                Kode {tenant.code}
              </p>
            </div>
            <div className="flex gap-3">
              <MapPin size={18} className="shrink-0 mt-0.5" />
              <p className="text-sm">
                {tenant.office.address}
                <span className="block text-muted-foreground mt-1">
                  Radius presensi {tenant.office.radius} m
                </span>
              </p>
            </div>
            <div className="flex gap-3">
              <Clock size={18} className="shrink-0 mt-0.5" />
              <p className="text-sm">
                Masuk {tenant.workStart}, pulang {tenant.workEnd}
                <span className="block text-muted-foreground mt-1">
                  Toleransi terlambat {tenant.graceMin} menit
                </span>
              </p>
            </div>
          </Panel>

          <Panel title="Bergabung" bodyClassName="p-5">
            <p className="text-sm text-muted-foreground">
              {user.position} sejak{' '}
              <span className="text-foreground font-bold">
                {fmtDate(user.joinedAt, 'd MMMM yyyy')}
              </span>
              . Akses data Anda terbatas pada {tenant.name}.
            </p>
            <Btn
              variant="ghost"
              size="sm"
              className="mt-4"
              onClick={() => onNavigate('profil')}
            >
              Buka profil
            </Btn>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

export default EmployeeDashboard;
