import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Database,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  XCircle,
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
  Meter,
  PageHead,
  Panel,
  Pill,
  Stat,
  TableWrap,
  theadCls,
  thCls,
} from '../../components/ui';

const SCHEMA = [
  {
    table: 'tenants',
    keys: 'id PK · code UNIQUE · license_key · max_users · active_until',
    rule: 'Akar isolasi: setiap tabel lain membawa tenant_id',
  },
  {
    table: 'users',
    keys: 'id PK · tenant_id FK · nik · role · password_hash',
    rule: 'UNIQUE(tenant_id, nik): NIK sama boleh di tenant berbeda',
  },
  {
    table: 'attendances',
    keys: 'id PK · tenant_id FK · user_id FK · date · lat/lng · photo',
    rule: 'tenant_id harus sama dengan milik user; immutable setelah dicatat',
  },
  {
    table: 'work_journals',
    keys: 'id PK · tenant_id FK · attendance_id FK · review_status',
    rule: 'Hanya bisa dibuat dari presensi masuk; terkunci setelah disetujui',
  },
  {
    table: 'talent_consents',
    keys: 'id PK · nik · requester_tenant_id · status',
    rule: 'Rekam jejak lintas tenant hanya terbuka bila status APPROVED',
  },
];

function Check({ ok, title, detail, value }) {
  return (
    <li className="flex items-start gap-3 px-5 py-3.5">
      {ok ? (
        <CheckCircle2 className="size-5 shrink-0 mt-0.5" aria-label="Lulus" />
      ) : (
        <XCircle
          className="size-5 shrink-0 mt-0.5 text-destructive"
          aria-label="Gagal"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="font-bold leading-snug">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
      </div>
      <span className="font-display text-2xl font-extrabold tabular-nums leading-none">
        {value}
      </span>
    </li>
  );
}

/**
 * SuperDashboard - 1:1 dengan figma desain/src/app/component/super/Dashbor.tsx
 */
export function SuperDashboard({ onNavigate }) {
  const { tenants, users, attendances, journals, audit, extendLicense } =
    useStore();
  const { now } = useClock();
  const today = dateKey(now);
  const [hoveredCode, setHoveredCode] = useState(null);

  const rows = useMemo(
    () =>
      tenants.map((t) => {
        const days = diffCalendarDays(t.activeUntil, now);
        return {
          t,
          days,
          expired: days < 0,
          active: users.filter((u) => u.tenantId === t.id && u.active).length,
          users: users.filter((u) => u.tenantId === t.id).length,
          att: attendances.filter((a) => a.tenantId === t.id).length,
          jr: journals.filter((j) => j.tenantId === t.id).length,
          au: audit.filter((a) => a.tenantId === t.id).length,
        };
      }),
    [tenants, users, attendances, journals, audit, now]
  );

  const integrity = useMemo(() => {
    const userTenant = new Map(users.map((u) => [u.id, u.tenantId]));
    const attTenant = new Map(attendances.map((a) => [a.id, a.tenantId]));
    const attMismatch = attendances.filter(
      (a) => userTenant.get(a.userId) !== a.tenantId
    ).length;
    const jrMismatch = journals.filter(
      (j) => attTenant.get(j.attendanceId) !== j.tenantId
    ).length;
    const seen = new Set();
    let dupes = 0;
    const tenantsByNik = new Map();
    users.forEach((u) => {
      const k = `${u.tenantId}|${u.nik}`;
      if (seen.has(k)) dupes++;
      seen.add(k);
      const setForNik = tenantsByNik.get(u.nik) ?? new Set();
      setForNik.add(u.tenantId);
      tenantsByNik.set(u.nik, setForNik);
    });
    const shared = [...tenantsByNik.values()].filter((s) => s.size > 1).length;
    return { attMismatch, jrMismatch, dupes, shared };
  }, [users, attendances, journals]);

  const activeTenants = rows.filter((r) => !r.t.suspended && !r.expired).length;
  const expiredCount = rows.filter((r) => r.expired).length;
  const suspendedCount = rows.filter((r) => r.t.suspended).length;
  const totalActive = rows.reduce((n, r) => n + r.active, 0);
  const totalQuota = tenants.reduce((n, t) => n + t.maxUsers, 0);
  const todayAtt = attendances.filter((a) => a.date === today).length;

  const attention = rows
    .filter((r) => r.expired || r.days <= 60)
    .sort((a, b) => a.days - b.days);

  const chart = rows.map((r) => ({
    kode: r.t.code,
    Aktif: r.active,
    Sisa: Math.max(0, r.t.maxUsers - r.active),
    total: Math.max(1, r.t.maxUsers),
  }));

  const maxChartTotal = Math.max(25, ...chart.map((c) => c.Aktif + c.Sisa));
  const xTicks = [
    0,
    Math.round(maxChartTotal * 0.25),
    Math.round(maxChartTotal * 0.5),
    Math.round(maxChartTotal * 0.75),
    maxChartTotal,
  ];

  return (
    <div>
      <PageHead
        kicker="Super Admin · pemilik platform"
        title="Konsol platform"
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Stat
          tone="accent"
          label="Tenant aktif"
          value={activeTenants}
          hint={`dari ${tenants.length} tenant`}
        />
        <Stat
          tone={expiredCount ? 'alert' : 'card'}
          label="Lisensi kedaluwarsa"
          value={expiredCount}
          hint={expiredCount ? 'perlu diperpanjang' : 'tidak ada'}
        />
        <Stat
          label="Ditangguhkan"
          value={suspendedCount}
          hint="akses diblokir"
        />
        <Stat
          label="Pengguna / kuota"
          value={
            <>
              {totalActive}
              <span className="text-xl opacity-50">/{totalQuota}</span>
            </>
          }
          hint={`${Math.round((totalActive / Math.max(1, totalQuota)) * 100)}% kapasitas terpakai`}
        />
        <Stat
          tone="dark"
          label="Presensi hari ini"
          value={todayAtt}
          hint="lintas tenant, agregat"
        />
      </div>

      <div className="grid lg:grid-cols-5 gap-6 mt-6">
        <Panel
          className="lg:col-span-3"
          kicker="Perpanjangan"
          title="Lisensi perlu tindakan"
          action={
            <Btn variant="ghost" size="sm" onClick={() => onNavigate('tenant')}>
              Kelola tenant <ArrowRight className="size-4" />
            </Btn>
          }
          bodyClassName="p-0"
        >
          {attention.length === 0 ? (
            <div className="p-5">
              <Empty
                icon={<KeyRound className="size-8" />}
                title="Semua lisensi aman"
                text="Tidak ada lisensi yang kedaluwarsa atau berakhir dalam 60 hari."
              />
            </div>
          ) : (
            <ul className="divide-y-2 divide-foreground/15">
              {attention.map(({ t, days, expired }) => (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center gap-3 px-5 py-4"
                >
                  <span className="font-mono font-bold bg-foreground text-accent px-2 py-1 rounded-sm text-sm">
                    {t.code}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      Berakhir {fmtDate(t.activeUntil)} ·{' '}
                      {expired
                        ? `lewat ${Math.abs(days)} hari`
                        : days === 0
                          ? 'hari ini'
                          : `${days} hari lagi`}
                    </p>
                  </div>
                  <Pill tone={expired ? 'warn' : 'mute'}>
                    {expired ? 'Kedaluwarsa' : 'Segera berakhir'}
                  </Pill>
                  <Btn
                    variant="accent"
                    size="sm"
                    onClick={() => extendLicense(t.id, 12)}
                    aria-label={`Perpanjang 12 bulan ${t.name}`}
                  >
                    <RefreshCw className="size-4" /> +12 bulan
                  </Btn>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          className="lg:col-span-2"
          kicker="Kapasitas"
          title="Pengguna per tenant"
        >
          <div
            className="h-56 flex flex-col justify-between relative select-none"
            role="img"
            aria-label="Grafik batang pengguna aktif dan sisa kuota per tenant"
          >
            {/* Area Bar Horizontal */}
            <div className="flex-1 flex flex-col justify-around relative pl-12 pr-2 py-2 border-l border-b border-foreground">
              {/* Garis Grid Vertikal */}
              <div className="absolute inset-0 left-12 right-2 flex justify-between pointer-events-none">
                {xTicks.map((tick) => (
                  <div
                    key={tick}
                    className="h-full border-r border-foreground/15 first:border-r-0"
                  />
                ))}
              </div>

              {chart.map((item) => {
                const activePct = (item.Aktif / maxChartTotal) * 100;
                const sisaPct = (item.Sisa / maxChartTotal) * 100;
                const isHovered = hoveredCode === item.kode;
                return (
                  <div
                    key={item.kode}
                    className="relative flex items-center h-9 group"
                    onMouseEnter={() => setHoveredCode(item.kode)}
                    onMouseLeave={() => setHoveredCode(null)}
                  >
                    <span className="absolute -left-12 w-10 text-right pr-2 font-mono text-xs text-foreground">
                      {item.kode}
                    </span>
                    <div className="w-full h-6 flex items-center relative z-10">
                      {item.Aktif > 0 && (
                        <div
                          style={{ width: `${activePct}%` }}
                          className="h-full bg-foreground transition-all"
                        />
                      )}
                      {item.Sisa > 0 && (
                        <div
                          style={{ width: `${sisaPct}%` }}
                          className="h-full bg-accent border border-foreground transition-all"
                        />
                      )}
                    </div>

                    {isHovered && (
                      <div className="absolute left-1/3 -top-12 z-20 border-2 border-foreground rounded-md bg-card px-3 py-2 text-xs shadow-sm pointer-events-none whitespace-nowrap">
                        <p className="font-mono font-bold">{item.kode}</p>
                        <p className="tabular-nums">
                          Aktif: <b>{item.Aktif}</b> · Sisa: <b>{item.Sisa}</b>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sumbu X */}
            <div className="pl-12 pr-2 pt-1.5 flex justify-between text-[11px] tabular-nums text-foreground">
              {xTicks.map((tick) => (
                <span key={tick}>{tick}</span>
              ))}
            </div>
          </div>

          <div className="flex gap-4 mt-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <i className="size-3 bg-foreground inline-block" /> Aktif
            </span>
            <span className="flex items-center gap-1.5">
              <i className="size-3 bg-accent border border-foreground inline-block" />{' '}
              Sisa kuota
            </span>
          </div>
        </Panel>
      </div>

      <Panel
        className="mt-6"
        kicker="Multi-tenant · satu basis data"
        title="Monitor isolasi basis data"
        action={
          <Pill
            tone={
              integrity.attMismatch + integrity.jrMismatch + integrity.dupes ===
              0
                ? 'ok'
                : 'warn'
            }
          >
            <ShieldCheck className="size-3.5" />{' '}
            {integrity.attMismatch + integrity.jrMismatch + integrity.dupes ===
            0
              ? 'Terisolasi'
              : 'Ada pelanggaran'}
          </Pill>
        }
        bodyClassName="p-5 space-y-6"
      >
        <TableWrap min={720}>
          <thead className={theadCls}>
            <tr>
              <th className={thCls}>Kode</th>
              <th className={`${thCls} text-right`}>users</th>
              <th className={`${thCls} text-right`}>attendances</th>
              <th className={`${thCls} text-right`}>journals</th>
              <th className={`${thCls} text-right`}>audit</th>
              <th className={thCls}>Utilisasi kuota</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ t, active, users: nu, att, jr, au }) => {
              const pct = Math.round((active / Math.max(1, t.maxUsers)) * 100);
              return (
                <tr
                  key={t.id}
                  className="border-t-2 border-foreground/15 hover:bg-secondary/50"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold">{t.code}</span>
                    <span className="block text-[11px] font-mono text-muted-foreground">
                      tenant_id = {t.id}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{nu}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{att}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{jr}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{au}</td>
                  <td className="px-4 py-3 w-56">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <Meter
                          value={pct}
                          tone={pct >= 90 ? 'dark' : 'accent'}
                        />
                      </div>
                      <span className="text-xs tabular-nums w-20 text-right">
                        {active}/{t.maxUsers} · {pct}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="border-2 border-foreground rounded-md bg-card">
            <div className="px-5 py-3 border-b-2 border-foreground">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Dihitung dari data saat ini
              </p>
              <h3 className="font-display text-lg font-extrabold">
                Audit integritas
              </h3>
            </div>
            <ul className="divide-y-2 divide-foreground/15">
              <Check
                ok={integrity.attMismatch === 0}
                value={integrity.attMismatch}
                title="Presensi dengan tenant_id ≠ tenant pemilik pengguna"
                detail="Harus 0: tidak ada presensi yang menyeberang tenant."
              />
              <Check
                ok={integrity.jrMismatch === 0}
                value={integrity.jrMismatch}
                title="Jurnal dengan tenant_id ≠ tenant presensinya"
                detail="Harus 0: jurnal selalu mengikuti tenant presensi induknya."
              />
              <Check
                ok={integrity.dupes === 0}
                value={integrity.dupes}
                title="Pelanggaran UNIQUE(tenant_id, nik)"
                detail="Harus 0: tidak ada NIK ganda dalam satu tenant."
              />
              <Check
                ok
                value={integrity.shared}
                title="NIK yang muncul di lebih dari satu tenant"
                detail="Diizinkan, tidak bentrok karena dikunci per tenant."
              />
            </ul>
          </div>

          <div className="bg-foreground text-background border-2 border-foreground rounded-md p-5 flex flex-col">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-60 flex items-center gap-2">
              <Database className="size-3.5" /> Middleware tenant
            </p>
            <pre className="font-mono text-sm leading-relaxed mt-3 whitespace-pre-wrap break-words">
              <span className="text-accent">SELECT</span> *{' '}
              <span className="text-accent">FROM</span> attendances{'\n'}
              <span className="text-accent">WHERE</span> tenant_id = :tenant_id
              {'\n'}
              {'  '}
              <span className="text-accent">AND</span> date {'>='} :from
            </pre>
            <p className="text-sm opacity-70 mt-auto pt-4">
              Klausa <span className="font-mono">tenant_id = :tenant_id</span>{' '}
              ditambahkan otomatis oleh middleware pada setiap kueri. Pemanggil
              tidak bisa melewatinya.
            </p>
          </div>
        </div>
      </Panel>

      <Panel
        className="mt-6"
        kicker="Skema PRD"
        title="Model data"
        bodyClassName="p-5"
      >
        <TableWrap min={720}>
          <thead className={theadCls}>
            <tr>
              <th className={thCls}>Tabel</th>
              <th className={thCls}>Atribut kunci</th>
              <th className={thCls}>Aturan integritas</th>
            </tr>
          </thead>
          <tbody>
            {SCHEMA.map((s) => (
              <tr
                key={s.table}
                className="border-t-2 border-foreground/15 align-top hover:bg-secondary/50"
              >
                <td className="px-4 py-3 font-mono font-bold whitespace-nowrap">
                  {s.table}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{s.keys}</td>
                <td className="px-4 py-3">{s.rule}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Panel>
    </div>
  );
}

export default SuperDashboard;
