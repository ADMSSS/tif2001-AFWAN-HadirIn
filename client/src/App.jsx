import React, { useState } from 'react';
import AuthPage from './pages/AuthPage';
import Shell from './components/Shell';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeePresensi from './pages/employee/EmployeePresensi';
import EmployeeJurnal from './pages/employee/EmployeeJurnal';
import EmployeeProfil from './pages/employee/EmployeeProfil';
import { AppStoreProvider } from './store/appStore';

const DIRECTORY_BY_NIK = {
  '3173014505950002': {
    userId: 'u-dewi',
    name: 'Dewi Lestari',
    role: 'karyawan',
    position: 'Staf Produksi',
  },
  '3173011508960003': {
    userId: 'u-budi',
    name: 'Budi Santoso',
    role: 'karyawan',
    position: 'Operator Gudang',
  },
  '3173012204970004': {
    userId: 'u-rina',
    name: 'Rina Wulandari',
    role: 'karyawan',
    position: 'Staf Administrasi Logistik',
  },
  '3173011201880001': {
    userId: 'u-hendra',
    name: 'Hendra Wijaya',
    role: 'admin',
    position: 'Manajer HR & Operasional',
  },
};

function loadInitialSession() {
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      const saved = JSON.parse(raw);
      const fullName = saved.full_name || saved.fullName || saved.name;
      if (fullName) {
        return {
          role: saved.role === 'super_admin' ? 'super' : saved.role || 'karyawan',
          tenantId: saved.tenant_id || saved.tenantId || 't-nlg',
          userId: saved.id || saved.userId || 'u-dewi',
          name: fullName,
          nik: saved.nik || '3173014505950002',
          position: saved.position || 'Staf Produksi',
        };
      }
    }
  } catch {
    // Abaikan jika JSON di localStorage tidak valid
  }
  return {
    role: 'karyawan',
    tenantId: 't-nlg',
    userId: 'u-dewi',
    name: 'Dewi Lestari',
    nik: '3173014505950002',
    position: 'Staf Produksi',
  };
}

export default function App() {
  const [session, setSession] = useState(loadInitialSession);
  const [page, setPage] = useState('dasbor');

  const handleAuth = (authData) => {
    const matched = authData?.nik ? DIRECTORY_BY_NIK[authData.nik] : null;
    const resolvedName =
      authData?.name ||
      matched?.name ||
      (authData?.role === 'super'
        ? authData?.username || 'Super Admin'
        : `Karyawan ${authData?.nik ? authData.nik.slice(-4) : ''}`.trim());

    const nextSession = {
      role: authData?.role || matched?.role || 'karyawan',
      tenantId: 't-nlg',
      userId: authData?.userId || matched?.userId || 'u-dewi',
      name: resolvedName,
      nik: authData?.nik || '3173014505950002',
      position: authData?.position || matched?.position || 'Staf Produksi',
    };

    localStorage.setItem('user', JSON.stringify(nextSession));
    setSession(nextSession);
    setPage('dasbor');
  };

  const handleLogout = () => {
    localStorage.removeItem('hadirin_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
        {page === 'profil' && <EmployeeProfil session={session} />}
      </Shell>
    </AppStoreProvider>
  );
}
