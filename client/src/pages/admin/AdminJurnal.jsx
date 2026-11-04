import React, { useMemo, useState } from 'react';
import { Check, CheckCheck, Clock, Lock, X } from 'lucide-react';
import {
  fmtDate,
  fmtTime,
  hm,
  useScoped,
  useStore,
} from '../../utils/formatters';
import { Avatar, Btn, Empty, PageHead, Pill } from '../../components/ui';

const SEGS = [
  ['menunggu', 'Menunggu'],
  ['disetujui', 'Disetujui'],
  ['ditolak', 'Ditolak'],
  ['semua', 'Semua'],
];

const TASK = {
  selesai: 'Selesai',
  berjalan: 'Berjalan',
  tertunda: 'Tertunda',
};

export function AdminJurnal({ session }) {
  const { users, attendances, journals } = useScoped(session.tenantId);
  const { reviewJournal } = useStore();
  const [seg, setSeg] = useState('menunggu');
  const [userId, setUserId] = useState('semua');
  const [open, setOpen] = useState(null);
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const [bulk, setBulk] = useState(false);

  const staff = useMemo(
    () =>
      users
        .filter((u) => u.role === 'karyawan')
        .sort((a, b) => a.fullName.localeCompare(b.fullName, 'id')),
    [users]
  );

  const byUser = useMemo(
    () => journals.filter((j) => userId === 'semua' || j.userId === userId),
    [journals, userId]
  );

  const count = (s) =>
    s === 'semua' ? byUser.length : byUser.filter((j) => j.review === s).length;

  const shown = useMemo(
    () =>
      byUser
        .filter((j) => seg === 'semua' || j.review === seg)
        .sort((a, b) =>
          a.date === b.date ? (a.id < b.id ? 1 : -1) : a.date < b.date ? 1 : -1
        ),
    [byUser, seg]
  );

  const pendingShown = shown.filter((j) => j.review === 'menunggu');

  const userOf = (id) => users.find((u) => u.id === id);
  const checkInOf = (j) =>
    attendances.find((a) => a.id === j.attendanceId)?.checkIn;

  const start = (id, mode) => {
    setOpen({ id, mode });
    setNote('');
    setErr('');
  };

  const submit = (j) => {
    if (!open) return;
    if (open.mode === 'ditolak' && note.trim().length < 5) {
      setErr(
        'Catatan evaluasi wajib diisi (minimal 5 karakter) agar karyawan tahu apa yang perlu diperbaiki.'
      );
      return;
    }
    reviewJournal(j.id, open.mode, note, session.name);
    setOpen(null);
  };

  const approveAll = () => {
    pendingShown.forEach((j) =>
      reviewJournal(j.id, 'disetujui', '', session.name)
    );
    setBulk(false);
  };

  return (
    <div>
      <PageHead
        kicker="Review jurnal kerja"
        title="Jurnal"
        action={
          pendingShown.length > 0 && (
            <Btn onClick={() => setBulk(true)}>
              <CheckCheck className="size-4" />
              Setujui semua yang tampil ({pendingShown.length})
            </Btn>
          )
        }
      />

      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div
          role="group"
          aria-label="Status review"
          className="flex border-2 border-foreground rounded-md overflow-x-auto no-scrollbar"
        >
          {SEGS.map(([k, l]) => (
            <button
              key={k}
              type="button"
              aria-pressed={seg === k}
              onClick={() => setSeg(k)}
              className={`px-4 py-2.5 font-display font-bold whitespace-nowrap flex items-center gap-2 transition-colors cursor-pointer ${
                seg === k
                  ? 'bg-foreground text-accent'
                  : 'bg-card hover:bg-secondary'
              }`}
            >
              {l}
              <span
                className={`font-mono text-[11px] tabular-nums px-1.5 rounded-sm ${
                  seg === k
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-secondary'
                }`}
              >
                {count(k)}
              </span>
            </button>
          ))}
        </div>

        <label className="block min-w-56">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Karyawan
          </span>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="mt-1.5 w-full border-2 border-foreground rounded-md bg-card px-3 py-2.5 outline-none focus-visible:shadow-[4px_4px_0_0_#c9f23c] transition-shadow"
          >
            <option value="semua">Semua karyawan</option>
            {staff.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName}
              </option>
            ))}
          </select>
        </label>
      </div>

      {shown.length === 0 ? (
        <Empty
          icon={<Check className="size-8" />}
          title={
            seg === 'menunggu'
              ? 'Tidak ada jurnal yang menunggu'
              : 'Tidak ada jurnal'
          }
          text="Jurnal baru muncul di sini setelah karyawan mengirimnya dari presensi masuk."
        />
      ) : (
        <ul className="grid xl:grid-cols-2 gap-4">
          {shown.map((j) => {
            const u = userOf(j.userId);
            const isOpen = open?.id === j.id;
            const ci = checkInOf(j);
            return (
              <li
                key={j.id}
                className={`border-2 border-foreground rounded-md bg-card flex flex-col ${
                  j.review === 'menunggu'
                    ? 'shadow-[4px_4px_0_0_#111611]'
                    : ''
                }`}
              >
                <div className="p-5 flex-1">
                  <div className="flex items-start gap-3">
                    <Avatar name={u?.fullName ?? '?'} size={38} />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold leading-tight truncate">
                        {u?.fullName ?? '—'}
                      </p>
                      <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground tabular-nums">
                        {fmtDate(j.date, 'EEE d MMM yyyy')}
                        {ci ? ` · masuk ${fmtTime(ci)}` : ''}
                      </p>
                    </div>
                    <Pill
                      tone={
                        j.review === 'disetujui'
                          ? 'ok'
                          : j.review === 'ditolak'
                            ? 'warn'
                            : 'mute'
                      }
                    >
                      {j.review === 'menunggu'
                        ? 'Menunggu'
                        : j.review === 'disetujui'
                          ? 'Disetujui'
                          : 'Ditolak'}
                    </Pill>
                  </div>

                  <h3 className="font-display text-xl font-extrabold leading-tight mt-4">
                    {j.title}
                  </h3>
                  <p className="text-sm mt-1.5 text-foreground/80">
                    {j.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Pill tone="mute">
                      <Clock className="size-3" />
                      {hm(j.minutes)}
                    </Pill>
                    <Pill tone={j.status === 'selesai' ? 'ok' : 'mute'}>
                      {TASK[j.status] || 'Selesai'}
                    </Pill>
                  </div>

                  {j.review !== 'menunggu' && (
                    <div className="mt-4 border-2 border-foreground/30 rounded-md bg-secondary/50 p-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
                        <Lock className="size-3" />
                        Terkunci
                        {j.reviewedAt
                          ? ` · ${fmtDate(j.reviewedAt, 'dd/MM/yyyy HH:mm')}`
                          : ''}
                      </p>
                      <p className="text-sm mt-1.5">
                        {j.note ?? (
                          <span className="text-muted-foreground">
                            Tanpa catatan.
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {isOpen && open && (
                    <div className="mt-4">
                      <label className="block">
                        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                          {open.mode === 'ditolak'
                            ? 'Catatan evaluasi (wajib)'
                            : 'Catatan (opsional)'}
                        </span>
                        <textarea
                          autoFocus
                          rows={3}
                          value={note}
                          onChange={(e) => {
                            setNote(e.target.value);
                            setErr('');
                          }}
                          aria-invalid={!!err}
                          placeholder={
                            open.mode === 'ditolak'
                              ? 'Jelaskan bagian yang perlu diperbaiki'
                              : 'Tambahkan masukan bila perlu'
                          }
                          className="mt-1.5 w-full border-2 border-foreground rounded-md bg-card px-3 py-2 outline-none resize-y focus-visible:shadow-[4px_4px_0_0_#c9f23c] transition-shadow"
                        />
                      </label>
                      {err && (
                        <p
                          role="alert"
                          className="mt-2 text-sm font-bold text-destructive"
                        >
                          {err}
                        </p>
                      )}
                      <div className="flex gap-2 mt-3">
                        <Btn
                          size="sm"
                          variant={
                            open.mode === 'ditolak' ? 'danger' : 'primary'
                          }
                          onClick={() => submit(j)}
                        >
                          {open.mode === 'ditolak' ? (
                            <X className="size-4" />
                          ) : (
                            <Check className="size-4" />
                          )}
                          {open.mode === 'ditolak'
                            ? 'Kirim penolakan'
                            : 'Konfirmasi setuju'}
                        </Btn>
                        <Btn
                          size="sm"
                          variant="ghost"
                          onClick={() => setOpen(null)}
                        >
                          Batal
                        </Btn>
                      </div>
                    </div>
                  )}
                </div>

                {j.review === 'menunggu' && !isOpen && (
                  <div className="flex border-t-2 border-foreground">
                    <button
                      type="button"
                      onClick={() => start(j.id, 'disetujui')}
                      className="flex-1 flex items-center justify-center gap-2 py-3 font-display font-bold bg-accent hover:bg-foreground hover:text-accent transition-colors cursor-pointer"
                    >
                      <Check className="size-4" />
                      Setujui
                    </button>
                    <button
                      type="button"
                      onClick={() => start(j.id, 'ditolak')}
                      className="flex-1 flex items-center justify-center gap-2 py-3 font-display font-bold border-l-2 border-foreground bg-card text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors cursor-pointer"
                    >
                      <X className="size-4" />
                      Tolak
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {bulk && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-foreground/70 grid place-items-center p-4"
        >
          <div className="w-full max-w-md border-2 border-foreground rounded-md bg-card p-6 shadow-[8px_8px_0_0_#111611]">
            <h2 className="font-display text-2xl font-extrabold">
              Setujui {pendingShown.length} jurnal?
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Semua jurnal berstatus menunggu yang sedang tampil akan disetujui
              tanpa catatan dan terkunci. Tindakan ini tercatat di audit trail
              atas nama {session.name}.
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <Btn variant="ghost" onClick={() => setBulk(false)}>
                Batal
              </Btn>
              <Btn onClick={approveAll}>Ya, setujui semua</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminJurnal;
