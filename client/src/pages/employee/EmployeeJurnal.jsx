import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Lock,
  NotebookPen,
  Pencil,
  Send,
} from 'lucide-react';
import {
  dateKey,
  fmtDate,
  hm,
  inputCls,
  useClock,
  useStore,
} from '../../utils/formatters';
import {
  Btn,
  Empty,
  Field,
  PageHead,
  Panel,
  Pill,
} from '../../components/ui';

const TASK = [
  { id: 'selesai', label: 'Selesai' },
  { id: 'berjalan', label: 'Berjalan' },
  { id: 'tertunda', label: 'Tertunda' },
];

const REVIEW_PILL = {
  menunggu: { tone: 'mute', label: 'Menunggu' },
  disetujui: { tone: 'ok', label: 'Disetujui' },
  ditolak: { tone: 'warn', label: 'Ditolak' },
};

const FILTERS = [
  { id: 'semua', label: 'Semua' },
  { id: 'menunggu', label: 'Menunggu' },
  { id: 'disetujui', label: 'Disetujui' },
  { id: 'ditolak', label: 'Ditolak' },
];

const emptyDraft = {
  title: '',
  description: '',
  amount: '60',
  unit: 'menit',
  status: 'selesai',
};

const toMinutes = (d) =>
  Math.round(
    Number(String(d.amount).replace(',', '.')) * (d.unit === 'jam' ? 60 : 1)
  );

function JournalForm({ draft, setDraft, idp }) {
  const set = (k, v) => setDraft({ ...draft, [k]: v });
  return (
    <div className="space-y-4">
      <Field label="Judul tugas">
        <input
          className={inputCls}
          value={draft.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Mis. Rekonsiliasi kas harian cabang Senayan"
          maxLength={120}
        />
      </Field>
      <Field label="Uraian capaian">
        <textarea
          className={`${inputCls} resize-y min-h-24`}
          value={draft.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Apa yang sudah dikerjakan dan hasilnya"
          rows={3}
        />
      </Field>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Estimasi waktu">
          <div className="flex items-center gap-2">
            <input
              className={`${inputCls} tabular-nums`}
              inputMode="decimal"
              value={draft.amount}
              onChange={(e) =>
                set('amount', e.target.value.replace(/[^\d.,]/g, ''))
              }
            />
            <select
              aria-label="Satuan waktu"
              value={draft.unit}
              onChange={(e) => set('unit', e.target.value)}
              className="bg-transparent font-bold outline-none cursor-pointer"
            >
              <option value="menit">menit</option>
              <option value="jam">jam</option>
            </select>
          </div>
        </Field>
        <fieldset>
          <legend className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Status penyelesaian
          </legend>
          <div className="mt-1.5 grid grid-cols-3 border-2 border-foreground rounded-md overflow-hidden bg-card">
            {TASK.map((t) => (
              <label key={t.id} className="cursor-pointer">
                <input
                  type="radio"
                  name={`task-${idp}`}
                  className="peer sr-only"
                  checked={draft.status === t.id}
                  onChange={() => set('status', t.id)}
                />
                <span className="block text-center py-2.5 px-1 font-bold text-xs sm:text-sm truncate peer-checked:bg-foreground peer-checked:text-accent peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-4 hover:bg-secondary peer-checked:hover:bg-foreground">
                  {t.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </div>
  );
}

function JournalItem({ j }) {
  const { reviseJournal } = useStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [err, setErr] = useState('');
  const pill = REVIEW_PILL[j.review] || REVIEW_PILL.menunggu;

  const startEdit = () => {
    const hours = j.minutes % 60 === 0 && j.minutes >= 60;
    setDraft({
      title: j.title,
      description: j.description,
      amount: String(hours ? j.minutes / 60 : j.minutes),
      unit: hours ? 'jam' : 'menit',
      status: j.status,
    });
    setErr('');
    setEditing(true);
  };

  const save = () => {
    const minutes = toMinutes(draft);
    if (!draft.title.trim() || !draft.description.trim()) {
      setErr('Judul tugas dan uraian capaian wajib diisi.');
      return;
    }
    if (!(minutes > 0)) {
      setErr('Estimasi waktu harus lebih dari 0 menit.');
      return;
    }
    reviseJournal(j.id, {
      title: draft.title.trim(),
      description: draft.description.trim(),
      minutes,
      status: draft.status,
    });
    setEditing(false);
  };

  return (
    <li
      className={`border-2 border-foreground rounded-md p-4 ${
        j.review === 'ditolak'
          ? 'bg-card border-l-[6px] border-l-destructive'
          : 'bg-card'
      }`}
    >
      {editing ? (
        <div>
          <JournalForm draft={draft} setDraft={setDraft} idp={j.id} />
          {err && (
            <p className="text-xs font-bold text-destructive mt-2">{err}</p>
          )}
          <div className="flex gap-2 mt-4">
            <Btn size="sm" onClick={save}>
              <Send size={14} /> Kirim revisi
            </Btn>
            <Btn size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Batal
            </Btn>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="font-display text-lg font-extrabold leading-tight">
                {j.title}
              </h4>
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                {j.description}
              </p>
            </div>
            <Pill tone={pill.tone}>{pill.label}</Pill>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm">
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <Clock size={14} /> {hm(j.minutes)}
            </span>
            <Pill tone={j.status === 'selesai' ? 'dark' : 'mute'}>
              {TASK.find((t) => t.id === j.status)?.label}
            </Pill>
            {j.review === 'disetujui' && (
              <span
                className="inline-flex items-center gap-1.5 text-muted-foreground"
                title="Terkunci setelah disetujui"
              >
                <Lock size={14} /> Terkunci
              </span>
            )}
            {j.review === 'ditolak' && (
              <Btn
                size="sm"
                variant="ghost"
                className="ml-auto"
                onClick={startEdit}
              >
                <Pencil size={14} /> Revisi
              </Btn>
            )}
          </div>
          {j.note && (
            <p
              className={`mt-3 border-2 border-foreground rounded-md px-3 py-2 text-sm ${
                j.review === 'ditolak'
                  ? 'bg-destructive text-destructive-foreground'
                  : 'bg-secondary'
              }`}
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-70 block">
                Catatan admin
              </span>
              {j.note}
            </p>
          )}
        </>
      )}
    </li>
  );
}

export function EmployeeJurnal({ session, onNavigate }) {
  const { users, attendances, journals, addJournal } = useStore();
  const { now } = useClock();
  const user = users.find((u) => u.id === session.userId);
  const key = dateKey(now);
  const [draft, setDraft] = useState(emptyDraft);
  const [filter, setFilter] = useState('semua');
  const [feedback, setFeedback] = useState(null);

  const today = attendances.find(
    (a) => a.userId === session.userId && a.date === key
  );
  const mine = useMemo(
    () => journals.filter((j) => j.userId === session.userId),
    [journals, session.userId]
  );

  const groups = useMemo(() => {
    const list = mine.filter((j) => filter === 'semua' || j.review === filter);
    const map = new Map();
    for (const j of [...list].reverse()) {
      map.set(j.date, [...(map.get(j.date) ?? []), j]);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [mine, filter]);

  if (!user) return null;

  const submit = async (e) => {
    e.preventDefault();
    setFeedback(null);
    if (!today) return;
    const r = await addJournal(user.id, today.id, {
      title: draft.title,
      description: draft.description,
      minutes: toMinutes(draft),
      status: draft.status,
    });
    if (!r.ok) {
      setFeedback({ type: 'error', text: r.error });
      return;
    }
    setFeedback({
      type: 'ok',
      text: 'Jurnal terkirim, menunggu tinjauan admin.',
    });
    setDraft(emptyDraft);
  };

  const count = (s) => mine.filter((j) => j.review === s).length;

  return (
    <div>
      <PageHead kicker="Catatan kerja harian" title="Jurnal" />

      <div className="grid lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] gap-6 items-start">
        {today ? (
          <Panel
            title="Jurnal baru"
            kicker={`Presensi masuk ${fmtDate(today.date, 'd MMM')}`}
          >
            <form onSubmit={submit}>
              <JournalForm draft={draft} setDraft={setDraft} idp="baru" />
              {feedback && (
                <p
                  role={feedback.type === 'error' ? 'alert' : 'status'}
                  className={`mt-3 text-xs font-bold ${
                    feedback.type === 'error'
                      ? 'text-destructive'
                      : 'text-foreground bg-accent/60 border border-foreground rounded px-2.5 py-1.5'
                  }`}
                >
                  {feedback.text}
                </p>
              )}
              <Btn type="submit" className="mt-5 w-full">
                <NotebookPen size={18} /> Kirim jurnal
              </Btn>
            </form>
          </Panel>
        ) : (
          <section className="border-2 border-dashed border-foreground rounded-md bg-secondary/50 p-6">
            <Lock size={26} />
            <h2 className="font-display text-2xl font-extrabold tracking-tight mt-3">
              Jurnal terkunci
            </h2>
            <p className="text-muted-foreground mt-2">
              Jurnal hanya bisa diisi setelah presensi masuk hari ini tercatat.
              Ini memastikan setiap capaian kerja terhubung dengan kehadiran
              nyata.
            </p>
            {onNavigate && (
              <Btn className="mt-5" onClick={() => onNavigate('presensi')}>
                Ke halaman Presensi
              </Btn>
            )}
          </section>
        )}

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div
              role="group"
              aria-label="Filter status review"
              className="inline-flex border-2 border-foreground rounded-md overflow-hidden bg-card"
            >
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-3.5 py-2 font-display font-bold text-sm focus-visible:outline-2 focus-visible:-outline-offset-4 cursor-pointer ${
                    filter === f.id
                      ? 'bg-foreground text-accent'
                      : 'hover:bg-secondary'
                  }`}
                >
                  {f.label}
                  <span className="ml-1.5 font-mono text-[11px] tabular-nums opacity-70">
                    {f.id === 'semua' ? mine.length : count(f.id)}
                  </span>
                </button>
              ))}
            </div>
            <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <CheckCircle2 size={14} /> {count('disetujui')} dari {mine.length}{' '}
              jurnal disetujui
            </p>
          </div>

          {groups.length === 0 ? (
            <Empty
              icon={<NotebookPen size={28} />}
              title="Belum ada jurnal"
              text={
                filter === 'semua'
                  ? 'Jurnal yang Anda kirim akan muncul di sini.'
                  : 'Tidak ada jurnal dengan status tersebut.'
              }
            />
          ) : (
            <div className="space-y-6">
              {groups.map(([date, items]) => (
                <section key={date}>
                  <header className="flex items-baseline justify-between border-b-2 border-foreground pb-1.5 mb-3">
                    <h3 className="font-display text-xl font-extrabold">
                      {fmtDate(date, 'EEEE, d MMMM yyyy')}
                    </h3>
                    <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground tabular-nums">
                      Total {hm(items.reduce((s, j) => s + j.minutes, 0))}
                    </span>
                  </header>
                  <ul className="space-y-3">
                    {items.map((j) => (
                      <JournalItem key={j.id} j={j} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployeeJurnal;
