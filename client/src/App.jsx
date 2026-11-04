import React, { useState } from 'react';
import AuthPage from './pages/AuthPage';
import Shell from './components/Shell';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeePresensi from './pages/employee/EmployeePresensi';
import EmployeeJurnal from './pages/employee/EmployeeJurnal';
import { AppStoreProvider } from './store/appStore';
import { Btn, PageHead, Panel } from './components/ui';
import { ArrowLeft } from 'lucide-react';

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
          setelah review halaman <strong>Jurnal</strong> selesai.
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
          <EmployeeJurnal session={session} onNavigate={setPage} />
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
