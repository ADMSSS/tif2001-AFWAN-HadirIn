import React, { useEffect, useMemo, useState } from 'react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  FileDown,
  FileSpreadsheet,
  Lock,
  ScrollText,
  Search,
  X,
} from 'lucide-react';
import {
  addDaysDate,
  dateKey,
  diffMinutes,
  fmtDate,
  fmtTime,
  hm,
  summarize,
  thCls,
  theadCls,
  useClock,
  useScoped,
} from '../../utils/formatters';
import {
  Btn,
  Empty,
  PageHead,
  Pill,
  Stat,
  TableWrap,
} from '../../components/ui';

const ctl =
  'border-2 border-foreground rounded-md bg-card px-3 py-2 w-full outline-none focus-visible:shadow-[4px_4px_0_0_#c9f23c] transition-shadow';

function auditTone(action) {
  if (/RESET|DEACTIVATED|REJECTED|SUSPEND/.test(action)) return 'warn';
  if (/CREATED|ACTIVATED|APPROVED|EXTENDED|PROVISIONED|VERIFIED/.test(action))
    return 'ok';
  return 'mute';
}

export function AdminRekap({ session }) {
  const { tenant, users, attendances, journals, audit } = useScoped(
    session.tenantId
  );
  const { now } = useClock();
  const [tab, setTab] = useState('presensi');
  const [from, setFrom] = useState(() => dateKey(addDaysDate(now, -29)));
  const [to, setTo] = useState(() => dateKey(now));
  const [userId, setUserId] = useState('semua');
  const [status, setStatus] = useState('semua');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [photo, setPhoto] = useState(null);

  // Debounced Search (300ms) sesuai Bagian 1.1 Sprint 2
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim().toLowerCase());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const staff = useMemo(
    () =>
      users
        .filter((u) => u.role === 'karyawan')
        .sort((a, b) => a.fullName.localeCompare(b.fullName, 'id')),
    [users]
  );

  const nameOf = (id) => users.find((u) => u.id === id)?.fullName ?? '—';

  const rows = useMemo(
    () =>
      attendances
        .filter((a) => {
          const empName = (
            users.find((u) => u.id === a.userId)?.fullName ?? ''
          ).toLowerCase();
          const matchSearch =
            !debouncedSearch ||
            empName.includes(debouncedSearch) ||
            a.date.includes(debouncedSearch);
          return (
            a.date >= from &&
            a.date <= to &&
            (userId === 'semua' || a.userId === userId) &&
            (status === 'semua' || a.status === status) &&
            matchSearch
          );
        })
        .sort((a, b) =>
          a.date === b.date
            ? a.checkIn < b.checkIn
              ? 1
              : -1
            : a.date < b.date
              ? 1
              : -1
        ),
    [attendances, users, from, to, userId, status, debouncedSearch]
  );

  // Metadata Paginasi (Offset = (Page - 1) * Limit) sesuai Bagian 1.1 PDF
  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / limit));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * limit;
  const pagedRows = rows.slice(offset, offset + limit);

  const dur = (a) => (a.checkOut ? diffMinutes(a.checkOut, a.checkIn) : null);

  const summary = useMemo(
    () =>
      staff
        .filter((u) => userId === 'semua' || u.id === userId)
        .map((u) => ({
          u,
          s: summarize(
            attendances.filter((a) => a.userId === u.id),
            journals.filter((j) => j.userId === u.id),
            from < u.joinedAt ? u.joinedAt : from,
            to
          ),
        }))
        .filter(
          (r) =>
            r.s.hadir > 0 ||
            (r.u.active && (!r.u.leftAt || r.u.leftAt >= from))
        ),
    [staff, attendances, journals, from, to, userId]
  );

  const totalMin = rows.reduce((s, a) => s + (dur(a) ?? 0), 0);
  const tepat = rows.filter((a) => a.status === 'tepat').length;
  const rangeOk = from <= to;
  const range = `${from}_${to}`;

  const exportXlsx = () => {
    const header = [
      'Tanggal',
      'Nama',
      'Masuk',
      'Pulang',
      'Durasi',
      'Jarak (m)',
      'Akurasi (m)',
      'Status',
    ];
    const csvRows = [
      header.join(','),
      ...rows.map((a) => {
        const d = dur(a);
        return [
          a.date,
          `"${nameOf(a.userId)}"`,
          fmtTime(a.checkIn),
          fmtTime(a.checkOut),
          d === null ? '-' : hm(d),
          Math.round(a.distance ?? 12),
          Math.round(a.accuracy ?? 14),
          a.status === 'tepat' ? 'Tepat waktu' : 'Terlambat',
        ].join(',');
      }),
    ];
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hadirin-${tenant.code}-${range}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    const sumHtml = summary
      .map(
        ({ u, s }) => `
        <tr>
          <td>${u.fullName}</td>
          <td>${u.position}</td>
          <td>${s.workdays}</td>
          <td>${s.hadir}</td>
          <td>${s.tepat}</td>
          <td>${s.terlambat}</td>
          <td>${s.alpa}</td>
          <td>${s.pctHadir}%</td>
          <td>${s.pctTepat}%</td>
          <td>${s.jam}</td>
        </tr>`
      )
      .join('');
    const detHtml = rows
      .map((a) => {
        const d = dur(a);
        return `
        <tr>
          <td>${a.date}</td>
          <td>${nameOf(a.userId)}</td>
          <td>${fmtTime(a.checkIn)}</td>
          <td>${fmtTime(a.checkOut)}</td>
          <td>${d === null ? '—' : hm(d)}</td>
          <td>${Math.round(a.distance ?? 12)} m</td>
          <td>±${Math.round(a.accuracy ?? 14)} m</td>
          <td>${a.status === 'tepat' ? 'Tepat waktu' : 'Terlambat'}</td>
        </tr>`;
      })
      .join('');
    win.document.write(`
      <html>
        <head>
          <title>${tenant.name} — Rekap Presensi</title>
          <style>
            body { font-family: sans-serif; padding: 24px; color: #111611; }
            h1 { margin: 0 0 4px 0; font-size: 20px; }
            p { margin: 0 0 16px 0; font-size: 12px; color: #565a4d; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11px; }
            th { background: #111611; color: #c9f23c; text-align: left; padding: 6px 8px; }
            td { border: 1px solid #ccc; padding: 6px 8px; }
          </style>
        </head>
        <body>
          <h1>${tenant.name} — Rekap Presensi</h1>
          <p>Periode ${fmtDate(from)} s.d. ${fmtDate(to)} | Dicetak ${fmtDate(now, 'dd/MM/yyyy HH:mm')} oleh ${session.name}</p>
          <table>
            <thead>
              <tr>
                <th>Nama</th><th>Jabatan</th><th>Hari Kerja</th><th>Hadir</th><th>Tepat</th><th>Terlambat</th><th>Tidak Hadir</th><th>% Hadir</th><th>% Tepat</th><th>Jam Kerja</th>
              </tr>
            </thead>
            <tbody>${sumHtml}</tbody>
          </table>
          <table>
            <thead>
              <tr>
                <th>Tanggal</th><th>Nama</th><th>Masuk</th><th>Pulang</th><th>Durasi</th><th>Jarak</th><th>Akurasi</th><th>Status</th>
              </tr>
            </thead>
            <tbody>${detHtml}</tbody>
          </table>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div>
      <PageHead
        kicker={`${tenant.name} · ${tenant.code}`}
        title="Rekap & audit"
        action={
          tab === 'presensi' && (
            <div className="flex flex-wrap gap-2">
              <Btn
                variant="accent"
                size="sm"
                onClick={exportXlsx}
                disabled={!rangeOk || rows.length === 0}
              >
                <FileSpreadsheet className="size-4" /> Ekspor XLSX
              </Btn>
              <Btn
                variant="ghost"
                size="sm"
                onClick={exportPdf}
                disabled={!rangeOk || rows.length === 0}
              >
                <FileDown className="size-4" /> Ekspor PDF
              </Btn>
            </div>
          )
        }
      />

      <div
        role="tablist"
        aria-label="Jenis rekap"
        className="inline-flex border-2 border-foreground rounded-md overflow-hidden mb-6"
      >
        {[
          ['presensi', `Presensi (${rows.length})`],
          ['audit', `Audit trail (${audit.length})`],
        ].map(([id, label]) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`font-display font-bold px-4 py-2 text-sm transition-colors cursor-pointer ${
              tab === id
                ? 'bg-foreground text-accent'
                : 'bg-card hover:bg-secondary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'presensi' && (
        <div role="tabpanel" className="space-y-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Cari Kata Kunci
              </span>
              <div className="mt-1 flex items-center gap-2 border-2 border-foreground rounded-md bg-card px-3 py-2 focus-within:shadow-[4px_4px_0_0_#c9f23c]">
                <Search className="size-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Nama atau tanggal..."
                  className="w-full bg-transparent outline-none text-sm"
                />
              </div>
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Dari tanggal
              </span>
              <input
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPage(1);
                }}
                className={`${ctl} mt-1 tabular-nums`}
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Sampai tanggal
              </span>
              <input
                type="date"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPage(1);
                }}
                className={`${ctl} mt-1 tabular-nums`}
              />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Karyawan
              </span>
              <select
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                  setPage(1);
                }}
                className={`${ctl} mt-1`}
              >
                <option value="semua">Semua karyawan</option>
                {staff.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Status
              </span>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className={`${ctl} mt-1`}
              >
                <option value="semua">Semua status</option>
                <option value="tepat">Tepat waktu</option>
                <option value="terlambat">Terlambat</option>
              </select>
            </label>
          </div>

          {!rangeOk ? (
            <Empty
              title="Rentang tanggal tidak valid"
              text="Tanggal awal harus sebelum atau sama dengan tanggal akhir."
            />
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Stat
                  tone="accent"
                  label="Catatan"
                  value={rows.length}
                  hint={`${fmtDate(from, 'd MMM')}–${fmtDate(to, 'd MMM yyyy')}`}
                />
                <Stat
                  label="Tepat waktu"
                  value={`${rows.length ? Math.round((tepat / rows.length) * 100) : 0}%`}
                  hint={`${tepat} dari ${rows.length}`}
                />
                <Stat
                  label="Terlambat"
                  value={rows.length - tepat}
                  hint="catatan"
                />
                <Stat
                  tone="dark"
                  label="Total jam kerja"
                  value={Math.round(totalMin / 60)}
                  hint={hm(totalMin)}
                />
              </div>

              {rows.length === 0 ? (
                <Empty
                  title="Tidak ada catatan presensi"
                  text="Ubah filter tanggal, karyawan, atau kata kunci pencarian."
                />
              ) : (
                <>
                  <TableWrap min={860}>
                    <thead className={theadCls}>
                      <tr>
                        {[
                          'Tanggal',
                          'Nama',
                          'Masuk',
                          'Pulang',
                          'Durasi',
                          'Jarak',
                          'Akurasi',
                          'Status',
                          'Foto',
                        ].map((h) => (
                          <th key={h} className={thCls}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-foreground/10">
                      {pagedRows.map((a) => {
                        const d = dur(a);
                        return (
                          <tr
                            key={a.id}
                            className="hover:bg-secondary/50 transition-colors"
                          >
                            <td className="px-4 py-2.5 tabular-nums whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5">
                                <Lock
                                  className="size-3 text-muted-foreground"
                                  aria-label="Terkunci"
                                />
                                {fmtDate(a.date, 'EEE d MMM yy')}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-bold whitespace-nowrap">
                              {nameOf(a.userId)}
                            </td>
                            <td className="px-4 py-2.5 font-mono tabular-nums">
                              {fmtTime(a.checkIn)}
                            </td>
                            <td className="px-4 py-2.5 font-mono tabular-nums">
                              {fmtTime(a.checkOut)}
                            </td>
                            <td className="px-4 py-2.5 tabular-nums whitespace-nowrap">
                              {d === null ? '—' : hm(d)}
                            </td>
                            <td className="px-4 py-2.5 tabular-nums">
                              {Math.round(a.distance ?? 12)} m
                            </td>
                            <td className="px-4 py-2.5 tabular-nums">
                              ±{Math.round(a.accuracy ?? 14)} m
                            </td>
                            <td className="px-4 py-2.5">
                              <Pill tone={a.status === 'tepat' ? 'ok' : 'warn'}>
                                {a.status === 'tepat' ? 'Tepat' : 'Terlambat'}
                              </Pill>
                            </td>
                            <td className="px-4 py-2.5">
                              {a.photo ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPhoto({
                                      src: a.photo,
                                      name: nameOf(a.userId),
                                      date: a.date,
                                    })
                                  }
                                  aria-label={`Perbesar foto presensi ${nameOf(a.userId)}, ${a.date}`}
                                  className="block size-10 rounded-sm border-2 border-foreground overflow-hidden hover:shadow-[3px_3px_0_0_#c9f23c] transition-shadow cursor-pointer"
                                >
                                  <img
                                    src={a.photo}
                                    alt=""
                                    className="size-full object-cover"
                                  />
                                </button>
                              ) : (
                                <span className="text-muted-foreground">
                                  <Camera
                                    className="size-4"
                                    aria-label="Tidak ada foto"
                                  />
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </TableWrap>

                  {/* Kontrol Paginasi Standar Sprint 2 (totalRows, totalPages, currentPage, limit) */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-foreground rounded-md bg-card px-4 py-3">
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span>
                        Menampilkan <b>{offset + 1}</b>–
                        <b>{Math.min(offset + limit, totalRows)}</b> dari{' '}
                        <b>{totalRows}</b> baris
                      </span>
                      <label className="inline-flex items-center gap-1.5">
                        <span>Limit:</span>
                        <select
                          value={limit}
                          onChange={(e) => {
                            setLimit(Number(e.target.value));
                            setPage(1);
                          }}
                          className="border border-foreground rounded bg-background px-1.5 py-0.5 font-bold"
                        >
                          {[10, 25, 50].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Btn
                        variant="ghost"
                        size="sm"
                        disabled={currentPage <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="size-4" /> Sebelumnya
                      </Btn>
                      <span className="font-mono text-xs font-bold px-2 tabular-nums">
                        Halaman {currentPage} / {totalPages}
                      </span>
                      <Btn
                        variant="ghost"
                        size="sm"
                        disabled={currentPage >= totalPages}
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                      >
                        Berikutnya <ChevronRight className="size-4" />
                      </Btn>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'audit' && (
        <div role="tabpanel" className="space-y-4">
          <div className="flex items-start gap-3 border-2 border-foreground rounded-md bg-accent p-4">
            <Lock className="size-5 shrink-0 mt-0.5" />
            <p className="text-sm font-bold">
              Audit trail bersifat append-only: entri hanya bisa ditambah, tidak
              dapat diubah atau dihapus oleh siapa pun, termasuk admin.
            </p>
          </div>
          {audit.length === 0 ? (
            <Empty
              icon={<ScrollText className="size-8" />}
              title="Belum ada entri audit"
            />
          ) : (
            <TableWrap min={760}>
              <thead className={theadCls}>
                <tr>
                  {['Waktu', 'Aktor', 'Aksi', 'Detail'].map((h) => (
                    <th key={h} className={thCls}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-foreground/10">
                {audit.map((e) => (
                  <tr
                    key={e.id}
                    className="hover:bg-secondary/50 transition-colors align-top"
                  >
                    <td className="px-4 py-3 font-mono text-xs tabular-nums whitespace-nowrap">
                      {fmtDate(e.at, 'dd/MM/yyyy HH:mm:ss')}
                    </td>
                    <td className="px-4 py-3 font-bold whitespace-nowrap">
                      {e.actor}
                    </td>
                    <td className="px-4 py-3">
                      <Pill tone={auditTone(e.action)}>{e.action}</Pill>
                    </td>
                    <td className="px-4 py-3">{e.detail}</td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </div>
      )}

      {photo && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-foreground/70 grid place-items-center p-4"
          onClick={() => setPhoto(null)}
        >
          <div
            className="w-full max-w-md border-2 border-foreground rounded-md bg-card p-5 shadow-[8px_8px_0_0_#111611]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h2 className="font-display text-xl font-extrabold">
                  {photo.name}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Foto presensi masuk · {fmtDate(photo.date, 'EEEE, d MMMM yyyy')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPhoto(null)}
                aria-label="Tutup foto"
                className="size-8 rounded-md border-2 border-foreground grid place-items-center hover:bg-secondary cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
            <img
              src={photo.src}
              alt={`Foto presensi ${photo.name}`}
              className="w-full rounded-md border-2 border-foreground"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminRekap;
