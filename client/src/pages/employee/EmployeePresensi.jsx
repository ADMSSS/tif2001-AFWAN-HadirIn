import React, { useMemo, useState } from 'react';
import { CheckCircle2, Lock, MapPin, NotebookPen } from 'lucide-react';
import {
  dateKey,
  diffMinutes,
  fmtDate,
  fmtTime,
  hm,
  summarize,
  thCls,
  theadCls,
  useClock,
  useStore,
} from '../../utils/formatters';
import {
  Btn,
  Empty,
  PageHead,
  Pill,
  Stat,
  TableWrap,
} from '../../components/ui';
import { AttendanceFlow, ReceiptModal } from './PresensiFlow';

function Item({ label, value }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </dt>
      <dd className="font-display text-xl font-extrabold tabular-nums">
        {value}
      </dd>
    </div>
  );
}

export function EmployeePresensi({ session, onNavigate }) {
  const { users, tenants, attendances, journals, canCheckIn, canCheckOut } =
    useStore();
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

  const months = useMemo(() => {
    const set = new Set([
      key.slice(0, 7),
      ...mine.map((a) => a.date.slice(0, 7)),
    ]);
    return [...set].sort().reverse();
  }, [mine, key]);

  const [month, setMonth] = useState(key.slice(0, 7));
  const [receipt, setReceipt] = useState(null);

  if (!user || !tenant) return null;

  const inCheck = canCheckIn(user.id);
  const outCheck = canCheckOut(user.id);
  const openRec = mine.find((a) => !a.checkOut);
  const needJournalBeforeCheckout =
    Boolean(openRec) && outCheck.ok && !outCheck.hasTodayJournal;
  const mode = inCheck.ok
    ? 'masuk'
    : openRec && outCheck.ok
      ? 'pulang'
      : null;
  const today = mine.find((a) => a.date === key);

  const mStart = `${month}-01`;
  const [yNum, mNum] = month.split('-').map(Number);
  const endOfMonthDate = new Date(yNum, mNum, 0);
  const mEnd = dateKey(endOfMonthDate);

  const rows = mine
    .filter((a) => a.date.startsWith(month))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const stats = summarize(mine, myJournals, mStart, mEnd > key ? key : mEnd);
  const dur = (a) => (a.checkOut ? diffMinutes(a.checkOut, a.checkIn) : null);

  return (
    <div>
      {receipt && <ReceiptModal r={receipt} onClose={() => setReceipt(null)} />}
      <PageHead
        kickerClassName="lg:hidden"
        kicker={`${fmtDate(now, 'EEEE, d MMMM yyyy')} · ${fmtTime(now.toISOString())}`}
        title="Presensi"
      />

      <div className="space-y-6">
        {mode ? (
          <AttendanceFlow
            key={`${mode}-${openRec?.id ?? 'baru'}`}
            mode={mode}
            tenant={tenant}
            userId={user.id}
            needJournal={needJournalBeforeCheckout}
            onGoJournal={() => onNavigate('jurnal')}
            onDone={setReceipt}
          />
        ) : today?.checkOut ? (
          <section className="border-2 border-foreground rounded-md bg-accent text-accent-foreground p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] opacity-70">
              Hari ini
            </p>
            <h2 className="font-display text-3xl font-extrabold tracking-tight flex items-center gap-3 mt-1">
              <CheckCircle2 size={30} /> Presensi hari ini selesai
            </h2>
            <dl className="grid grid-cols-3 gap-4 mt-5 max-w-lg">
              <Item label="Masuk" value={fmtTime(today.checkIn)} />
              <Item label="Pulang" value={fmtTime(today.checkOut)} />
              <Item label="Durasi" value={hm(dur(today) ?? 0)} />
            </dl>
          </section>
        ) : today ? (
          <section className="border-2 border-foreground rounded-md bg-foreground text-background p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] opacity-70">
              Hari ini
            </p>
            <h2 className="font-display text-3xl font-extrabold tracking-tight mt-1">
              Masuk tercatat{' '}
              <span className="text-accent tabular-nums">
                {fmtTime(today.checkIn)}
              </span>
            </h2>
            <p className="mt-2 flex flex-wrap items-center gap-3">
              <Pill tone={today.status === 'tepat' ? 'ok' : 'warn'}>
                {today.status === 'tepat' ? 'Tepat waktu' : 'Terlambat'}
              </Pill>
              <span className="text-sm opacity-80">
                {needJournalBeforeCheckout
                  ? 'Jam kerja selesai. Wajib mengisi jurnal kerja hari ini terlebih dahulu sebelum presensi pulang.'
                  : outCheck.reason}
              </span>
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Btn
                variant="accent"
                size="sm"
                onClick={() => onNavigate('jurnal')}
              >
                <NotebookPen size={16} /> Isi jurnal kerja sebelum pulang
              </Btn>
            </div>
          </section>
        ) : (
          <section className="border-2 border-foreground rounded-md bg-card p-6 flex gap-4 items-start">
            <Lock size={28} className="shrink-0 mt-1" />
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Presensi belum bisa dilakukan
              </p>
              <h2 className="font-display text-2xl font-extrabold tracking-tight mt-1">
                {inCheck.reason}
              </h2>
              <p className="text-muted-foreground mt-2 max-w-xl">
                Jam kerja {tenant.workStart}–{tenant.workEnd}. Presensi masuk
                dibuka satu jam sebelum jam masuk.
              </p>
            </div>
          </section>
        )}

        <div>
          <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Arsip
              </p>
              <h2 className="font-display text-3xl font-extrabold tracking-tight leading-none mt-1">
                Riwayat presensi
              </h2>
            </div>
            <label className="flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Bulan
              </span>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="border-2 border-foreground rounded-md bg-card px-3 py-2 font-bold focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    {fmtDate(`${m}-01`, 'MMMM yyyy')}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <Stat
              label="Hari hadir"
              value={stats.hadir}
              hint={`dari ${stats.workdays} hari kerja`}
              tone="accent"
            />
            <Stat
              label="Tepat waktu"
              value={`${stats.pctTepat}%`}
              hint={`${stats.tepat} hari`}
            />
            <Stat
              label="Terlambat"
              value={stats.terlambat}
              hint="hari"
              tone={stats.terlambat ? 'alert' : 'card'}
            />
            <Stat
              label="Total jam"
              value={stats.jam}
              hint="jam kerja tercatat"
              tone="dark"
            />
          </div>

          {rows.length === 0 ? (
            <Empty
              icon={<MapPin size={28} />}
              title="Belum ada presensi"
              text="Tidak ada catatan presensi pada bulan ini."
            />
          ) : (
            <TableWrap min={820}>
              <thead className={theadCls}>
                <tr>
                  <th className={thCls}>Tanggal</th>
                  <th className={thCls}>Masuk</th>
                  <th className={thCls}>Keluar</th>
                  <th className={thCls}>Durasi</th>
                  <th className={thCls}>Jarak</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Foto</th>
                  <th className={thCls}>
                    <span className="sr-only">Terkunci</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => {
                  const d = dur(a);
                  return (
                    <tr
                      key={a.id}
                      className="border-t-2 border-foreground/15 hover:bg-secondary/60"
                    >
                      <td className="px-4 py-3 font-bold whitespace-nowrap">
                        {fmtDate(a.date, 'EEE, d MMM')}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {fmtTime(a.checkIn)}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {fmtTime(a.checkOut)}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {d === null ? '—' : hm(d)}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {Math.round(a.distance)} m
                      </td>
                      <td className="px-4 py-3">
                        <Pill tone={a.status === 'tepat' ? 'ok' : 'warn'}>
                          {a.status === 'tepat' ? 'Tepat' : 'Terlambat'}
                        </Pill>
                      </td>
                      <td className="px-4 py-3">
                        {a.photo ? (
                          <img
                            src={a.photo}
                            alt={`Foto presensi ${fmtDate(a.date)}`}
                            className="size-9 rounded-sm border-2 border-foreground object-cover"
                          />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          title="Terkunci permanen untuk audit"
                          aria-label="Terkunci permanen untuk audit"
                          className="inline-block text-muted-foreground"
                        >
                          <Lock size={16} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployeePresensi;
