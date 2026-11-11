import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  KeyRound,
  Trophy,
} from 'lucide-react';
import {
  addDaysDate,
  dateKey,
  diffCalendarDays,
  fmtDate,
  isWeekendDate,
  summarize,
  useClock,
  useScoped,
} from '../../utils/formatters';
import { Avatar, Btn, Empty, Meter, Panel, Pill, Stat } from '../../components/ui';

function AttendanceComposedChart({ series, maxStaff }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const yMax = Math.max(4, maxStaff || 4);
  const yTicks = [];
  for (let i = 0; i <= yMax; i += 1) {
    yTicks.push(i);
  }

  // SVG coordinate system for the line overlay & bars
  const W = 720;
  const H = 220;
  const padL = 32;
  const padR = 14;
  const padT = 14;
  const padB = 28;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const stepX = series.length > 0 ? plotW / series.length : plotW;

  const linePoints = series
    .map((d, idx) => {
      const cx = padL + stepX * idx + stepX / 2;
      const cy = padT + plotH * (1 - (d.pct || 0) / 100);
      return `${cx.toFixed(1)},${cy.toFixed(1)}`;
    })
    .join(' ');

  const hovered = hoverIdx !== null ? series[hoverIdx] : null;

  return (
    <div className="relative h-72 select-none">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full overflow-visible"
        onMouseLeave={() => setHoverIdx(null)}
      >
        {/* Horizontal Grid Lines & Y-Axis Labels */}
        {yTicks.map((val) => {
          const y = padT + plotH * (1 - val / yMax);
          return (
            <g key={val}>
              <line
                x1={padL}
                y1={y}
                x2={W - padR}
                y2={y}
                stroke="var(--foreground)"
                strokeOpacity={0.12}
                strokeWidth="1"
              />
              <text
                x={padL - 8}
                y={y + 3.5}
                textAnchor="end"
                className="font-mono text-[10px] fill-muted-foreground"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Bottom X-Axis Line */}
        <line
          x1={padL}
          y1={padT + plotH}
          x2={W - padR}
          y2={padT + plotH}
          stroke="var(--foreground)"
          strokeWidth="2"
        />

        {/* Bars & Hover Columns */}
        {series.map((d, idx) => {
          const colX = padL + stepX * idx;
          const cx = colX + stepX / 2;
          const barW = Math.min(26, stepX * 0.58);
          const bx = cx - barW / 2;

          const tepatH = (d.tepat / yMax) * plotH;
          const lateH = (d.terlambat / yMax) * plotH;
          const tepatY = padT + plotH - tepatH;
          const lateY = tepatY - lateH;

          const showTick = idx % 2 === 0 || idx === series.length - 1;

          return (
            <g
              key={d.label}
              onMouseEnter={() => setHoverIdx(idx)}
              className="cursor-pointer"
            >
              {/* Hover highlight column */}
              {hoverIdx === idx && (
                <rect
                  x={colX + 2}
                  y={padT}
                  width={stepX - 4}
                  height={plotH}
                  fill="var(--foreground)"
                  fillOpacity={0.06}
                />
              )}

              {/* Tepat Bar (Bottom of stack) */}
              {d.tepat > 0 && (
                <rect
                  x={bx}
                  y={tepatY}
                  width={barW}
                  height={tepatH}
                  fill="var(--accent)"
                  stroke="var(--foreground)"
                  strokeWidth="1.5"
                />
              )}

              {/* Terlambat Bar (Top of stack) */}
              {d.terlambat > 0 && (
                <rect
                  x={bx}
                  y={lateY}
                  width={barW}
                  height={lateH}
                  fill="var(--destructive)"
                  stroke="var(--foreground)"
                  strokeWidth="1.5"
                />
              )}

              {/* X-Axis Date Label */}
              {showTick && (
                <text
                  x={cx}
                  y={padT + plotH + 16}
                  textAnchor="middle"
                  className="font-mono text-[10px] fill-muted-foreground"
                >
                  {d.label}
                </text>
              )}

              {/* Transparent full-column hit target */}
              <rect
                x={colX}
                y={padT}
                width={stepX}
                height={plotH + 20}
                fill="transparent"
              />
            </g>
          );
        })}

        {/* Dashed Percentage Line */}
        {series.length > 1 && (
          <polyline
            fill="none"
            stroke="var(--foreground)"
            strokeWidth="2"
            strokeDasharray="5 3"
            points={linePoints}
            pointerEvents="none"
          />
        )}

        {/* Line Dots */}
        {series.map((d, idx) => {
          const cx = padL + stepX * idx + stepX / 2;
          const cy = padT + plotH * (1 - (d.pct || 0) / 100);
          return (
            <circle
              key={`dot-${d.label}`}
              cx={cx}
              cy={cy}
              r={hoverIdx === idx ? 4.5 : 3}
              fill="var(--foreground)"
              pointerEvents="none"
            />
          );
        })}
      </svg>

      {/* Tooltip Card (1:1 dengan ChartTip di Dashbor.tsx) */}
      {hovered && (
        <div
          className="pointer-events-none absolute top-2 right-2 border-2 border-foreground rounded-md bg-card px-3 py-2 shadow-[3px_3px_0_0_#c9f23c] z-10"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {hovered.label}
          </p>
          <p className="text-sm mt-1 tabular-nums">
            Tepat waktu: <b>{hovered.tepat}</b>
          </p>
          <p className="text-sm tabular-nums">
            Terlambat: <b>{hovered.terlambat}</b>
          </p>
          <p className="text-sm tabular-nums">
            Kehadiran: <b>{hovered.pct}%</b>
          </p>
        </div>
      )}
    </div>
  );
}

export function AdminDashboard({ session, onNavigate }) {
  const { tenant, users, attendances, journals } = useScoped(session.tenantId);
  const { now } = useClock();
  const [sort, setSort] = useState('hadir');
  const today = dateKey(now);

  const staff = useMemo(
    () => users.filter((u) => u.role === 'karyawan' && u.active),
    [users]
  );

  const stat = useMemo(() => {
    const ids = new Set(staff.map((u) => u.id));
    const t = attendances.filter((a) => a.date === today && ids.has(a.userId));
    return {
      hadir: t.length,
      terlambat: t.filter((a) => a.status === 'terlambat').length,
      belum: Math.max(0, staff.length - t.length),
      pulang: t.filter((a) => a.checkOut).length,
    };
  }, [staff, attendances, today]);

  const series = useMemo(() => {
    const ids = new Set(staff.map((u) => u.id));
    const out = [];
    for (
      let i = 0, d = new Date(now);
      out.length < 14 && i < 40;
      i += 1, d = addDaysDate(d, -1)
    ) {
      if (isWeekendDate(d)) continue;
      const key = dateKey(d);
      const day = attendances.filter(
        (a) => a.date === key && ids.has(a.userId)
      );
      const late = day.filter((a) => a.status === 'terlambat').length;
      out.unshift({
        label: fmtDate(key, 'EEE d MMM'),
        tepat: day.length - late,
        terlambat: late,
        pct: staff.length ? Math.round((day.length / staff.length) * 100) : 0,
      });
    }
    return out;
  }, [staff, attendances, now]);

  const perf = useMemo(() => {
    const to = today;
    const from = dateKey(addDaysDate(now, -29));
    return staff.map((u) => ({
      user: u,
      s: summarize(
        attendances.filter((a) => a.userId === u.id),
        journals.filter((j) => j.userId === u.id),
        from < u.joinedAt ? u.joinedAt : from,
        to
      ),
    }));
  }, [staff, attendances, journals, now, today]);

  const ranking = useMemo(
    () =>
      [...perf].sort((a, b) =>
        sort === 'hadir'
          ? b.s.pctHadir - a.s.pctHadir || b.s.pctTepat - a.s.pctTepat
          : b.s.pctTepat - a.s.pctTepat || b.s.pctHadir - a.s.pctHadir
      ),
    [perf, sort]
  );

  const attention = useMemo(
    () =>
      perf
        .filter((p) => p.s.terlambat >= 3 || p.s.pctHadir < 80)
        .sort((a, b) => a.s.pctHadir - b.s.pctHadir),
    [perf]
  );

  const pending = journals.filter((j) => j.review === 'menunggu').length;
  const activeUsers = users.filter((u) => u.active).length;
  const quota = Math.round((activeUsers / tenant.maxUsers) * 100);
  const daysLeft = diffCalendarDays(tenant.activeUntil, now);
  const expiring = daysLeft < 60;
  const maskedKey = (tenant.licenseKey || 'HDR-9N2K-7810-44AC').replace(
    /^(HDR-[A-Z0-9]{4})-.+$/,
    '$1-••••-••••'
  );
  const avgPct = series.length
    ? Math.round(series.reduce((s, d) => s + d.pct, 0) / series.length)
    : 0;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="lg:hidden font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {fmtDate(today, 'EEEE, d MMMM yyyy')}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight leading-none mt-1">
            {tenant.name}
          </h1>
        </div>
        <Pill tone="dark">Kode {tenant.code}</Pill>
      </div>

      <div className="grid lg:grid-cols-[1.7fr_1fr] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          <section aria-label="Kehadiran hari ini">
            {isWeekendDate(now) && (
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
                Akhir pekan — tidak ada jadwal kerja
              </p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat
                label="Hadir"
                value={stat.hadir}
                hint={`dari ${staff.length} karyawan aktif`}
                tone="dark"
              />
              <Stat
                label="Terlambat"
                value={stat.terlambat}
                hint={`batas ${tenant.workStart} + ${tenant.graceMin} mnt`}
                tone={stat.terlambat ? 'alert' : 'card'}
              />
              <Stat label="Belum hadir" value={stat.belum} tone="card" />
              <Stat
                label="Sudah pulang"
                value={stat.pulang}
                hint={`jam pulang ${tenant.workEnd}`}
                tone="accent"
              />
            </div>
          </section>

          <Panel
            title="Kehadiran 14 hari kerja"
            kicker={`Rata-rata ${avgPct}%`}
            action={
              <div
                className="hidden sm:flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest"
                aria-hidden
              >
                <span className="flex items-center gap-1.5">
                  <i className="size-3 bg-accent border border-foreground" />
                  Tepat
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="size-3 bg-destructive border border-foreground" />
                  Terlambat
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="w-4 h-0 border-t-2 border-dashed border-foreground" />
                  % hadir
                </span>
              </div>
            }
          >
            <div
              role="img"
              aria-label={`Grafik batang bertumpuk kehadiran 14 hari kerja terakhir. Rata-rata kehadiran ${avgPct} persen.`}
            >
              <AttendanceComposedChart
                series={series}
                maxStaff={staff.length}
              />
            </div>
          </Panel>

          <Panel
            title="Performa karyawan"
            kicker="30 hari terakhir"
            bodyClassName="p-0"
            action={
              <div
                role="group"
                aria-label="Urutkan ranking"
                className="flex border-2 border-foreground rounded-md overflow-hidden"
              >
                {[
                  ['hadir', 'Kehadiran'],
                  ['tepat', 'Ketepatan'],
                ].map(([k, l]) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={sort === k}
                    onClick={() => setSort(k)}
                    className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-colors cursor-pointer ${
                      sort === k
                        ? 'bg-foreground text-accent'
                        : 'bg-card hover:bg-secondary'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            }
          >
            {ranking.length === 0 ? (
              <div className="p-5">
                <Empty
                  title="Belum ada karyawan aktif"
                  text="Tambahkan karyawan dari menu Karyawan."
                />
              </div>
            ) : (
              <ol className="divide-y-2 divide-foreground/10">
                {ranking.map((r, i) => (
                  <li
                    key={r.user.id}
                    className={`grid grid-cols-[2rem_1fr] sm:grid-cols-[2rem_1.2fr_1.4fr_5rem_5rem] items-center gap-x-4 gap-y-2 px-5 py-3 ${
                      i < 3 ? 'bg-accent/25' : ''
                    }`}
                  >
                    <span className="font-display text-xl font-extrabold tabular-nums">
                      {i < 3 ? (
                        <Trophy
                          className="size-5"
                          aria-label={`Peringkat ${i + 1}`}
                        />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={r.user.fullName} size={34} />
                      <div className="min-w-0">
                        <p className="font-bold truncate">{r.user.fullName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {r.user.position}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-2 sm:col-span-1 sm:col-start-3 grid grid-cols-2 gap-3">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground flex justify-between">
                          <span>Hadir</span>
                          <span className="tabular-nums text-foreground">
                            {r.s.pctHadir}%
                          </span>
                        </p>
                        <Meter
                          value={r.s.pctHadir}
                          tone={sort === 'hadir' ? 'accent' : 'dark'}
                        />
                      </div>
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground flex justify-between">
                          <span>Tepat</span>
                          <span className="tabular-nums text-foreground">
                            {r.s.pctTepat}%
                          </span>
                        </p>
                        <Meter
                          value={r.s.pctTepat}
                          tone={sort === 'tepat' ? 'accent' : 'dark'}
                        />
                      </div>
                    </div>
                    <p className="hidden sm:block text-right tabular-nums text-sm">
                      <b>{r.s.jam}</b>{' '}
                      <span className="text-muted-foreground">jam</span>
                    </p>
                    <p className="hidden sm:block text-right tabular-nums text-sm">
                      <b>{r.s.hadir}</b>{' '}
                      <span className="text-muted-foreground">hari</span>
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>

        <div className="space-y-6 min-w-0">
          <Panel
            title="Perlu perhatian"
            kicker="Tindak lanjut"
            tone={attention.length || pending ? 'card' : 'accent'}
            bodyClassName="p-0"
          >
            <button
              type="button"
              onClick={() => onNavigate('jurnal')}
              className="w-full flex items-center gap-3 px-5 py-4 text-left border-b-2 border-foreground hover:bg-accent transition-colors cursor-pointer"
            >
              <BookOpenCheck className="size-6 shrink-0" />
              <span className="flex-1">
                <span className="block font-display text-2xl font-extrabold tabular-nums leading-none">
                  {pending}
                </span>
                <span className="block font-mono text-[11px] uppercase tracking-widest mt-1">
                  Jurnal menunggu review
                </span>
              </span>
              <ArrowRight className="size-5" />
            </button>
            {attention.length === 0 ? (
              <p className="px-5 py-4 text-sm">
                Tidak ada karyawan yang perlu ditindaklanjuti bulan ini.
              </p>
            ) : (
              <ul className="divide-y-2 divide-foreground/10 max-h-96 overflow-y-auto no-scrollbar">
                {attention.map((a) => (
                  <li
                    key={a.user.id}
                    className="px-5 py-3 flex items-start gap-3"
                  >
                    <AlertTriangle
                      className="size-4 mt-1 text-destructive shrink-0"
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold truncate">{a.user.fullName}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {a.s.terlambat >= 3 && (
                          <Pill tone="warn">Terlambat {a.s.terlambat}x</Pill>
                        )}
                        {a.s.pctHadir < 80 && (
                          <Pill tone="warn">Hadir {a.s.pctHadir}%</Pill>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Lisensi" kicker="Platform HadirIn" tone="dark">
            <div className="flex items-baseline justify-between">
              <p className="font-display text-4xl font-extrabold tabular-nums leading-none">
                {activeUsers}
                <span className="text-xl opacity-60"> / {tenant.maxUsers}</span>
              </p>
              <span className="font-mono text-[11px] uppercase tracking-widest opacity-70">
                pengguna aktif
              </span>
            </div>
            <div className="mt-3">
              <Meter value={quota} tone="accent" />
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="font-mono text-[11px] uppercase tracking-widest opacity-70">
                  Aktif sampai
                </dt>
                <dd className="tabular-nums font-bold">
                  {fmtDate(tenant.activeUntil)}
                </dd>
              </div>
              <div className="flex justify-between items-center gap-3">
                <dt className="font-mono text-[11px] uppercase tracking-widest opacity-70 flex items-center gap-1.5">
                  <KeyRound className="size-3.5" />
                  Kunci
                </dt>
                <dd className="font-mono tabular-nums">{maskedKey}</dd>
              </div>
            </dl>
            {expiring && (
              <div
                role="alert"
                className="mt-5 border-2 border-background rounded-md bg-destructive text-destructive-foreground p-3 flex gap-2.5"
              >
                <AlertTriangle className="size-5 shrink-0" />
                <p className="text-sm font-bold">
                  {daysLeft >= 0
                    ? `Lisensi berakhir ${daysLeft} hari lagi.`
                    : 'Lisensi sudah berakhir.'}{' '}
                  Hubungi penyedia platform untuk perpanjangan.
                </p>
              </div>
            )}
            {quota >= 90 && !expiring && (
              <p className="mt-4 text-sm opacity-80">Kuota hampir penuh.</p>
            )}
          </Panel>

          <Btn
            variant="accent"
            className="w-full"
            onClick={() => onNavigate('karyawan')}
          >
            Kelola karyawan <ArrowRight className="size-4" />
          </Btn>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
