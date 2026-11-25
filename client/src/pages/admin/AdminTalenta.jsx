import React, { useState } from 'react';
import {
  Check,
  Clock,
  Lock,
  Search,
  SearchX,
  Send,
  ShieldCheck,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { fmtDate, inputCls, useStore } from '../../utils/formatters';
import {
  Btn,
  Empty,
  Field,
  Meter,
  PageHead,
  Panel,
  Pill,
  Stat,
} from '../../components/ui';

const STEPS = ['Cari NIK', 'Izin karyawan', 'Lihat performa'];

const statusPill = {
  PENDING: { tone: 'mute', label: 'Menunggu' },
  APPROVED: { tone: 'ok', label: 'Disetujui' },
  REJECTED: { tone: 'warn', label: 'Ditolak' },
};

const maskShort = (nik) => `***${String(nik || '').slice(-4)}`;

function Stepper({ current }) {
  return (
    <ol className="grid grid-cols-3 gap-2 mb-6" aria-label="Alur izin akses">
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li
            key={s}
            aria-current={active ? 'step' : undefined}
            className={`border-2 border-foreground rounded-md px-3 py-2.5 flex items-center gap-2.5 ${
              active
                ? 'bg-accent'
                : done
                  ? 'bg-foreground text-background'
                  : 'bg-card text-muted-foreground'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-sm grid place-items-center font-display font-extrabold text-sm shrink-0 tabular-nums ${
                done
                  ? 'bg-accent text-accent-foreground'
                  : active
                    ? 'bg-foreground text-accent'
                    : 'border border-foreground/40'
              }`}
            >
              {done ? <Check size={14} /> : i + 1}
            </span>
            <span className="font-display font-bold text-sm leading-tight">
              {s}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function AdminTalenta({ session }) {
  const tenantId = session.tenantId;
  const { talentLookup, requestConsent, talentReport, consents } = useStore();
  const [input, setInput] = useState('');
  const [nik, setNik] = useState(null);
  const [err, setErr] = useState('');

  const search = (value) => {
    if (!/^\d{16}$/.test(value)) {
      setErr('NIK harus 16 digit angka.');
      setNik(null);
      return;
    }
    setErr('');
    setNik(value);
  };

  const lookup = nik ? talentLookup(tenantId, nik) : null;
  const consent = lookup?.consent;
  const report =
    nik && consent?.status === 'APPROVED' ? talentReport(tenantId, nik) : null;

  const step =
    !lookup || !lookup.found || lookup.ownEmployee ? 0 : report ? 2 : 1;

  const ask = () => {
    if (!nik) return;
    const r = requestConsent(tenantId, nik, session.name);
    if (!r.ok) {
      setErr(r.error);
    }
  };

  const mine = consents
    .filter((c) => c.requesterTenantId === tenantId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <div>
      <PageHead
        kicker="Rekam jejak lintas perusahaan · opt-in"
        title="Talenta"
      />
      <Stepper current={step} />

      <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
        <div className="space-y-6">
          <Panel title="Cari pelamar" kicker="Langkah 1">
            <form
              className="flex flex-col sm:flex-row gap-3 sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                search(input.trim());
              }}
            >
              <Field label="NIK pelamar (16 digit)" className="flex-1">
                <input
                  className={`${inputCls} font-mono tabular-nums`}
                  inputMode="numeric"
                  maxLength={16}
                  value={input}
                  onChange={(e) => setInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="3173011203980005"
                  aria-invalid={!!err}
                />
              </Field>
              <Btn type="submit" className="sm:mb-px">
                <Search size={18} /> Cari
              </Btn>
            </form>
            {err && (
              <p
                role="alert"
                className="mt-3 text-sm bg-destructive text-destructive-foreground border-2 border-foreground rounded-md px-3 py-2"
              >
                {err}
              </p>
            )}
          </Panel>

          {nik && lookup && !lookup.found && (
            <Empty
              icon={<SearchX size={36} />}
              title="NIK belum pernah terdata di platform"
              text="Tidak ada rekam jejak untuk NIK ini. Pelamar mungkin belum pernah bekerja di perusahaan pengguna HadirIn."
            />
          )}

          {nik && lookup?.ownEmployee && (
            <Panel tone="accent" title="Karyawan perusahaan Anda" kicker="Info">
              <div className="flex gap-3">
                <UserCheck size={24} className="shrink-0" aria-hidden />
                <p className="text-sm">
                  NIK {maskShort(nik)} adalah karyawan aktif di perusahaan Anda.
                  Lihat performanya langsung melalui menu Rekap, tanpa perlu
                  izin lintas perusahaan.
                </p>
              </div>
            </Panel>
          )}

          {nik && lookup?.found && !lookup.ownEmployee && !report && (
            <Panel
              title="Hasil pencarian"
              kicker={`Langkah 2 · NIK ${maskShort(nik)}`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-display text-3xl font-extrabold tracking-tight">
                  {lookup.maskedName}
                </p>
                <Pill tone="dark">
                  <Lock size={12} /> Identitas tersamar
                </Pill>
              </div>

              {(!consent || consent.status === 'REJECTED') && (
                <>
                  {consent?.status === 'REJECTED' && (
                    <p className="mt-4 text-sm bg-destructive text-destructive-foreground border-2 border-foreground rounded-md px-3 py-2 flex items-center gap-2">
                      <XCircle size={16} className="shrink-0" /> Karyawan
                      menolak permintaan sebelumnya
                      {consent.decidedAt
                        ? ` pada ${fmtDate(consent.decidedAt.slice(0, 10))}`
                        : ''}
                      . Anda boleh meminta ulang.
                    </p>
                  )}
                  <div className="mt-5 grid sm:grid-cols-2 gap-3">
                    <div className="border-2 border-foreground rounded-md p-4 bg-accent/40">
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Akan terlihat jika disetujui
                      </p>
                      <ul className="mt-2 text-sm space-y-1.5">
                        <li>Nama asli dan jabatan</li>
                        <li>Persentase kehadiran per perusahaan</li>
                        <li>Persentase tepat waktu</li>
                        <li>Jumlah jurnal yang disetujui</li>
                      </ul>
                    </div>
                    <div className="border-2 border-foreground rounded-md p-4 bg-card">
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Tidak pernah dibagikan
                      </p>
                      <ul className="mt-2 text-sm space-y-1.5">
                        <li>Foto presensi</li>
                        <li>Koordinat dan alamat IP</li>
                        <li>Isi jurnal harian secara rinci</li>
                      </ul>
                    </div>
                  </div>
                  <Btn className="mt-5" onClick={ask}>
                    <Send size={18} />{' '}
                    {consent
                      ? 'Minta ulang izin akses'
                      : 'Kirim permintaan izin akses'}
                  </Btn>
                </>
              )}

              {consent?.status === 'PENDING' && (
                <div className="mt-5 border-2 border-foreground rounded-md p-4 bg-secondary">
                  <p className="font-display font-bold text-lg flex items-center gap-2">
                    <Clock size={20} /> Menunggu persetujuan karyawan
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Permintaan dikirim oleh {consent.requestedBy} pada{' '}
                    {fmtDate(consent.createdAt.slice(0, 10))}. Karyawan harus
                    menyetujui permintaan akses di halaman Profilnya sebelum
                    data terbuka.
                  </p>
                </div>
              )}
            </Panel>
          )}

          {report && (
            <Panel
              title={report.name}
              kicker={`Langkah 3 · NIK ${maskShort(nik)} · izin disetujui`}
              action={<Pill tone="ok">Izin aktif</Pill>}
            >
              {report.rows.length === 0 ? (
                <Empty
                  title="Belum ada riwayat"
                  text="Tidak ada catatan kerja di perusahaan lain."
                />
              ) : (
                <ol className="relative ml-3 border-l-2 border-foreground space-y-6">
                  {report.rows.map((r) => (
                    <li
                      key={`${r.tenantName}-${r.from}`}
                      className="pl-6 relative"
                    >
                      <span
                        className="absolute -left-[9px] top-1.5 w-4 h-4 bg-accent border-2 border-foreground rounded-sm"
                        aria-hidden
                      />
                      <div className="border-2 border-foreground rounded-md p-4 bg-card">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-display text-xl font-extrabold leading-tight">
                              {r.tenantName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {r.position}
                            </p>
                          </div>
                          <Pill tone={r.to ? 'mute' : 'ok'}>
                            {fmtDate(r.from, 'MMM yyyy')} –{' '}
                            {r.to ? fmtDate(r.to, 'MMM yyyy') : 'kini'}
                          </Pill>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4 mt-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Kehadiran</span>
                              <span className="font-mono tabular-nums font-bold">
                                {r.pctHadir}%
                              </span>
                            </div>
                            <Meter value={r.pctHadir} />
                            <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                              {r.hadir} dari {r.workdays} hari kerja
                            </p>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Tepat waktu</span>
                              <span className="font-mono tabular-nums font-bold">
                                {r.pctTepat}%
                              </span>
                            </div>
                            <Meter value={r.pctTepat} tone="accent" />
                            <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                              {r.jurnalOk} jurnal disetujui
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>
          )}
        </div>

        <div className="space-y-6">
          <Panel title="Permintaan akses saya" kicker="Riwayat">
            {mine.length === 0 ? (
              <Empty
                title="Belum ada permintaan"
                text="Cari NIK pelamar untuk mengirim permintaan pertama."
              />
            ) : (
              <ul className="divide-y-2 divide-foreground/15 -my-2">
                {mine.map((c) => (
                  <li
                    key={c.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-mono tabular-nums font-bold">
                        {maskShort(c.nik)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fmtDate(c.createdAt.slice(0, 10))} · {c.requestedBy}
                      </p>
                    </div>
                    <Pill tone={statusPill[c.status]?.tone || 'mute'}>
                      {statusPill[c.status]?.label || c.status}
                    </Pill>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Kepatuhan UU PDP" kicker="Prinsip" tone="dark">
            <div className="flex gap-3">
              <ShieldCheck
                size={22}
                className="shrink-0 text-accent mt-0.5"
                aria-hidden
              />
              <p className="text-sm text-background/80">
                Data pribadi hanya dibuka atas persetujuan eksplisit pemilik
                data (opt-in). Pencarian menampilkan nama tersamar, hanya
                agregat kehadiran yang dibagikan, dan setiap permintaan tercatat
                di audit trail perusahaan Anda.
              </p>
            </div>
          </Panel>

          <Stat
            label="Permintaan disetujui"
            value={mine.filter((c) => c.status === 'APPROVED').length}
            hint={`dari ${mine.length} permintaan`}
          />
        </div>
      </div>
    </div>
  );
}

export default AdminTalenta;
