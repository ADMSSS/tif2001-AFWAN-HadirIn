import React, { useState } from 'react';
import AuthPage from './pages/AuthPage';
import Shell from './components/Shell';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeePresensi from './pages/employee/EmployeePresensi';
import { AppStoreProvider } from './store/appStore';
import { useStore, inputCls } from './utils/formatters';
import { Btn, Field, PageHead, Panel } from './components/ui';
import { ArrowLeft, CheckCircle2, NotebookPen } from 'lucide-react';

function QuickJournalPage({ session, onNavigate }) {
  const { attendances, journals, addJournal } = useStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minutes, setMinutes] = useState('480');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const todayAtt = attendances.find((a) => a.userId === session.userId && !a.checkOut);
  const myTodayJournals = journals.filter(
    (j) => j.userId === session.userId && j.attendanceId === todayAtt?.id
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    if (!todayAtt) {
      setErr('Anda belum melakukan presensi masuk hari ini.');
      return;
    }
    const res = await addJournal(session.userId, todayAtt.id, {
      title,
      description,
      minutes: Number(minutes) || 60,
      status: 'selesai',
    });
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setTitle('');
    setDescription('');
    setMsg('Jurnal kerja hari ini berhasil disimpan! Sekarang Anda dapat melakukan Presensi Pulang.');
  };

  return (
    <div>
      <PageHead
        kicker="Catatan kerja harian"
        title="Jurnal"
        action={
          <Btn variant="ghost" size="sm" onClick={() => onNavigate('dasbor')}>
            <ArrowLeft size={16} /> Kembali ke Dasbor
          </Btn>
        }
      />
      <div className="max-w-xl">
        <Panel
          title="Isi Jurnal Hari Ini"
          kicker={todayAtt ? `Presensi masuk tercatat` : 'Belum presensi'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Judul tugas">
              <input
                className={inputCls}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Mis. Rekonsiliasi manifes logistik harian"
              />
            </Field>
            <Field label="Uraian capaian">
              <textarea
                className={`${inputCls} min-h-24 resize-y`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Uraikan pekerjaan yang telah diselesaikan hari ini"
                rows={3}
              />
            </Field>
            <Field label="Estimasi waktu (menit)">
              <input
                className={inputCls}
                type="number"
                min="1"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
              />
            </Field>
            {err && (
              <p className="text-xs font-bold text-destructive">{err}</p>
            )}
            {msg && (
              <div className="border-2 border-foreground rounded-md bg-accent p-3 text-sm font-bold flex items-center gap-2">
                <CheckCircle2 size={18} /> {msg}
              </div>
            )}
            <div className="flex flex-wrap gap-3 pt-2">
              <Btn type="submit">
                <NotebookPen size={18} /> Simpan Jurnal Hari Ini
              </Btn>
              {myTodayJournals.length > 0 && (
                <Btn variant="accent" onClick={() => onNavigate('dasbor')}>
                  Lanjut ke Dasbor (Presensi Pulang)
                </Btn>
              )}
            </div>
          </form>
        </Panel>
      </div>
    </div>
  );
}

function PlaceholderPage({ title, kicker, onNavigate }) {
  return (
    <div>
      <PageHead
        kicker={kicker}
        title={title}
        action={
          <Btn variant="ghost" size="sm" onClick={() => onNavigate('dasbor')}>
            <ArrowLeft size={16} /> Kembali ke Dasbor
          </Btn>
        }
      />
      <Panel title={`Halaman ${title}`}>
        <p className="text-sm text-muted-foreground">
          Modul <strong>{title}</strong> akan dikerjakan pada langkah berikutnya
          setelah review halaman <strong>Dasbor</strong> selesai.
        </p>
      </Panel>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState({
    role: 'karyawan',
    tenantId: 't-nlg',
    userId: 'u-dewi',
    name: 'Dewi Lestari',
  });
  const [page, setPage] = useState('dasbor');

  const handleAuth = (authData) => {
    const role = authData?.role || 'karyawan';
    setSession({
      role,
      tenantId: 't-nlg',
      userId: 'u-dewi',
      name: authData?.name || 'Dewi Lestari',
    });
    setPage('dasbor');
  };

  const handleLogout = () => {
    localStorage.removeItem('hadirin_token');
    setSession(null);
  };

  if (!session) {
    return <AuthPage onAuth={handleAuth} />;
  }

  return (
    <AppStoreProvider>
      <Shell
        session={session}
        page={page}
        onNavigate={setPage}
        onLogout={handleLogout}
      >
        {page === 'dasbor' && (
          <EmployeeDashboard session={session} onNavigate={setPage} />
        )}
        {page === 'jurnal' && (
          <QuickJournalPage session={session} onNavigate={setPage} />
        )}
        {page === 'presensi' && (
          <EmployeePresensi session={session} onNavigate={setPage} />
        )}
        {page === 'profil' && (
          <PlaceholderPage
            title="Profil"
            kicker="Identitas & Privasi"
            onNavigate={setPage}
          />
        )}
      </Shell>
    </AppStoreProvider>
  );
}
