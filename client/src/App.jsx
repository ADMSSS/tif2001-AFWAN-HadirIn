import React, { useState } from 'react';
import AuthPage from './pages/AuthPage';
import Shell from './components/Shell';
import ForcePassword from './components/ForcePassword';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeePresensi from './pages/employee/EmployeePresensi';
import EmployeeJurnal from './pages/employee/EmployeeJurnal';
import EmployeeProfil from './pages/employee/EmployeeProfil';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminKaryawan from './pages/admin/AdminKaryawan';
import AdminRekap from './pages/admin/AdminRekap';
import AdminJurnal from './pages/admin/AdminJurnal';
import AdminLayarQR from './pages/admin/AdminLayarQR';
import AdminTalenta from './pages/admin/AdminTalenta';
import AdminPengaturan from './pages/admin/AdminPengaturan';
import SuperDashboard from './pages/super/SuperDashboard';
import SuperTenant from './pages/super/SuperTenant';
import { AppStoreProvider } from './store/appStore';
import { useStore } from './utils/formatters';

const DIRECTORY_BY_NIK = {
  '3173014505950002': {
    userId: 'u-dewi',
    tenantId: 't-nlg',
    name: 'Dewi Lestari',
    role: 'karyawan',
    position: 'Staf Produksi',
  },
  '3173011108930003': {
    userId: 'u-budi',
    tenantId: 't-nlg',
    name: 'Budi Santoso',
    role: 'karyawan',
    position: 'Operator Gudang',
  },
  '3173011508960003': {
    userId: 'u-budi',
    tenantId: 't-nlg',
    name: 'Budi Santoso',
    role: 'karyawan',
    position: 'Operator Gudang',
  },
  '3173011203980005': {
    userId: 'u-rina',
    tenantId: 't-nlg',
    name: 'Rina Wulandari',
    role: 'karyawan',
    position: 'Staf Administrasi Logistik',
  },
  '3173012204970004': {
    userId: 'u-rina',
    tenantId: 't-nlg',
    name: 'Rina Wulandari',
    role: 'karyawan',
    position: 'Staf Administrasi Logistik',
  },
  '3173012507920004': {
    userId: 'u-fajar',
    tenantId: 't-nlg',
    name: 'Fajar Nugroho',
    role: 'karyawan',
    position: 'Koordinator Armada',
  },
  '3173012207990011': {
    userId: 'u-fajar',
    tenantId: 't-nlg',
    name: 'Fajar Nugroho',
    role: 'karyawan',
    position: 'Koordinator Armada',
  },
  '3173010101800001': {
    userId: 'u-hendra',
    tenantId: 't-nlg',
    name: 'Hendra Wijaya',
    role: 'admin',
    position: 'Manajer HR & Operasional',
  },
  '3173011201880001': {
    userId: 'u-hendra',
    tenantId: 't-nlg',
    name: 'Hendra Wijaya',
    role: 'admin',
    position: 'Manajer HR & Operasional',
  },
  '3273015506850010': {
    userId: 'u-rama-kps',
    tenantId: 't-kps',
    name: 'Rama Putra',
    role: 'admin',
    position: 'HR & Operasional',
  },
  '3578016104910032': {
    userId: 'u-siti-kps',
    tenantId: 't-kps',
    name: 'Siti Aminah',
    role: 'karyawan',
    position: 'Supervisor Barista & Logistik',
  },
  '3578010202820001': {
    userId: 'u-bmt-admin',
    tenantId: 't-bmt',
    name: 'dr. Aditya Pratama',
    role: 'admin',
    position: 'Direktur Operasional',
  },
  '3578014408950019': {
    userId: 'u-bmt-emp',
    tenantId: 't-bmt',
    name: 'Nadia Kusuma',
    role: 'karyawan',
    position: 'Apoteker Klinik',
  },
};

function loadInitialSession() {
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      const saved = JSON.parse(raw);
      const fullName = saved.full_name || saved.fullName || saved.name;
      if (fullName) {
        const resolvedRole =
          saved.role === 'super_admin'
            ? 'super'
            : saved.role === 'company_admin'
            ? 'admin'
            : saved.role || 'karyawan';
        return {
          role: resolvedRole,
          tenantId:
            resolvedRole === 'super'
              ? undefined
              : saved.tenant_id || saved.tenantId || 't-nlg',
          userId:
            saved.id ||
            saved.userId ||
            (resolvedRole === 'super' ? 'u-super' : 'u-dewi'),
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

function AppContent() {
  const { tenants, users } = useStore();
  const [session, setSession] = useState(loadInitialSession);
  const [page, setPage] = useState('dasbor');

  const handleAuth = (authData) => {
    const codeUpper = String(authData?.companyCode || '').toUpperCase();
    const matchedTenant = tenants.find(
      (t) => t.code.toUpperCase() === codeUpper
    );
    const storeUser = authData?.nik
      ? users.find(
          (u) =>
            u.nik === authData.nik &&
            (!matchedTenant || u.tenantId === matchedTenant.id)
        ) || users.find((u) => u.nik === authData.nik)
      : null;

    const matched = storeUser
      ? {
          userId: storeUser.id,
          tenantId: storeUser.tenantId,
          name: storeUser.fullName,
          role: storeUser.role,
          position: storeUser.position,
        }
      : authData?.nik
      ? DIRECTORY_BY_NIK[authData.nik]
      : null;

    const isKps = codeUpper === 'KPS';
    const isBmt = codeUpper === 'BMT';
    const isPasswordAdmin = authData?.password === 'admin123';

    const resolvedRole =
      authData?.role === 'super_admin' || authData?.role === 'super'
        ? 'super'
        : authData?.role === 'company_admin'
        ? 'admin'
        : authData?.role ||
          matched?.role ||
          (isPasswordAdmin ? 'admin' : 'karyawan');

    const resolvedTenantId =
      resolvedRole === 'super'
        ? undefined
        : matched?.tenantId ||
          matchedTenant?.id ||
          (isKps ? 't-kps' : isBmt ? 't-bmt' : 't-nlg');

    const fallbackAdminName = isKps
      ? 'Rama Putra'
      : isBmt
      ? 'dr. Aditya Pratama'
      : 'Hendra Wijaya';
    const fallbackAdminId = isKps
      ? 'u-rama-kps'
      : isBmt
      ? 'u-bmt-admin'
      : 'u-hendra';
    const fallbackAdminPos = isKps
      ? 'HR & Operasional'
      : isBmt
      ? 'Direktur Operasional'
      : 'Manajer HR & Operasional';

    const resolvedName =
      authData?.name ||
      matched?.name ||
      (resolvedRole === 'super'
        ? authData?.username === 'superadmin' || !authData?.username
          ? 'Platform Owner'
          : authData.username
        : resolvedRole === 'admin'
        ? fallbackAdminName
        : `Karyawan ${authData?.nik ? authData.nik.slice(-4) : ''}`.trim());

    const nextSession = {
      role: resolvedRole,
      tenantId: resolvedTenantId,
      userId:
        authData?.userId ||
        matched?.userId ||
        (resolvedRole === 'super'
          ? 'u-super'
          : resolvedRole === 'admin'
          ? fallbackAdminId
          : 'u-dewi'),
      name: resolvedName,
      nik:
        authData?.nik ||
        (resolvedRole === 'admin'
          ? isKps
            ? '3273015506850010'
            : '3173010101800001'
          : '3173014505950002'),
      position:
        authData?.position ||
        matched?.position ||
        (resolvedRole === 'super'
          ? 'Super Admin'
          : resolvedRole === 'admin'
          ? fallbackAdminPos
          : 'Staf Produksi'),
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
    <Shell
      session={session}
      page={page}
      onNavigate={setPage}
      onLogout={handleLogout}
    >
      {session.role === 'super' ? (
        <>
          {page === 'dasbor' && <SuperDashboard onNavigate={setPage} />}
          {page === 'tenant' && <SuperTenant />}
        </>
      ) : session.role === 'admin' ? (
        <>
          {page === 'dasbor' && (
            <AdminDashboard session={session} onNavigate={setPage} />
          )}
          {page === 'karyawan' && <AdminKaryawan session={session} />}
          {page === 'rekap' && <AdminRekap session={session} />}
          {page === 'jurnal' && <AdminJurnal session={session} />}
          {page === 'qr' && <AdminLayarQR session={session} />}
          {page === 'talenta' && <AdminTalenta session={session} />}
          {page === 'pengaturan' && <AdminPengaturan session={session} />}
        </>
      ) : (
        <>
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
        </>
      )}
      <ForcePassword session={session} />
    </Shell>
  );
}

export default function App() {
  return (
    <AppStoreProvider>
      <AppContent />
    </AppStoreProvider>
  );
}
