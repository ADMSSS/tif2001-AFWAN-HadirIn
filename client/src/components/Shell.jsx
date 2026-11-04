import React from 'react';
import {
  LayoutDashboard,
  ScanFace,
  NotebookPen,
  UserRound,
  Users,
  Table2,
  ClipboardCheck,
  QrCode,
  Handshake,
  Settings2,
  Building2,
  LogOut,
} from 'lucide-react';
import { useClock, useStore, fmtClock, fmtDate } from '../utils/formatters';
import { Wordmark, Avatar } from './ui';

const NAV = {
  karyawan: [
    { id: 'dasbor', label: 'Dasbor', icon: LayoutDashboard },
    { id: 'presensi', label: 'Presensi', icon: ScanFace },
    { id: 'jurnal', label: 'Jurnal', icon: NotebookPen },
    { id: 'profil', label: 'Profil', icon: UserRound },
  ],
  admin: [
    { id: 'dasbor', label: 'Dasbor', icon: LayoutDashboard },
    { id: 'karyawan', label: 'Karyawan', icon: Users },
    { id: 'rekap', label: 'Rekap', icon: Table2 },
    { id: 'jurnal', label: 'Jurnal', icon: ClipboardCheck },
    { id: 'qr', label: 'Layar QR', icon: QrCode },
    { id: 'talenta', label: 'Talenta', icon: Handshake },
    { id: 'pengaturan', label: 'Kantor', icon: Settings2 },
  ],
  super: [
    { id: 'dasbor', label: 'Dasbor', icon: LayoutDashboard },
    { id: 'tenant', label: 'Tenant', icon: Building2 },
  ],
};

const ROLE_LABEL = {
  karyawan: 'Karyawan',
  admin: 'Admin Perusahaan',
  super: 'Super Admin',
};

export function Shell({ session, page, onNavigate, onLogout, children }) {
  const { now, simulated, cycleClockMode } = useClock();
  const { tenants } = useStore();
  const tenant = tenants.find((t) => t.id === session.tenantId);
  const nav = NAV[session.role] || NAV.karyawan;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr] bg-background text-foreground">
      <aside className="hidden lg:flex flex-col bg-sidebar text-sidebar-foreground sticky top-0 h-screen px-5 py-6">
        <Wordmark dark className="text-3xl" />
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-sidebar-foreground/60 mt-2">
          {session.role === 'super' ? 'Konsol Platform' : 'Presensi & Jurnal'}
        </p>

        {tenant && (
          <div className="mt-6 border border-sidebar-border rounded-md px-3 py-2.5 bg-sidebar-accent/50">
            <p className="font-mono text-[10px] uppercase tracking-widest text-sidebar-foreground/60">
              Tenant · {tenant.code}
            </p>
            <p className="font-display font-bold leading-tight mt-0.5">
              {tenant.name}
            </p>
          </div>
        )}

        <nav className="mt-6 space-y-1" aria-label="Menu utama">
          {nav.map(({ id, label, icon: Icon }) => {
            const active = page === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                aria-current={active ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md font-display font-bold transition-colors focus-visible:outline-2 focus-visible:outline-sidebar-ring cursor-pointer ${
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'hover:bg-sidebar-accent'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-sidebar-border pt-5">
          <div className="flex items-center gap-3">
            <Avatar name={session.name} />
            <div className="min-w-0">
              <p className="font-bold truncate">{session.name}</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-sidebar-foreground/60">
                {ROLE_LABEL[session.role]}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="mt-4 w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>

      <div className="min-w-0 pb-24 lg:pb-0">
        <header className="relative flex items-center justify-between gap-4 px-5 lg:px-10 py-4 border-b-2 border-foreground bg-background sticky top-0 z-20">
          <div className="lg:hidden min-w-0">
            <Wordmark className="text-2xl" />
            {tenant && (
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground truncate mt-1">
                {tenant.name}
              </p>
            )}
          </div>
          {session.role === 'karyawan' && tenant ? (
            <>
              <p className="hidden lg:block font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {fmtDate(now, 'EEEE, d MMMM yyyy')}
              </p>
              <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Jam kerja
                </p>
                <p className="font-display text-xl font-extrabold tabular-nums leading-tight">
                  {tenant.workStart} – {tenant.workEnd}
                </p>
              </div>
            </>
          ) : (
            <p className="hidden lg:block font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {fmtDate(now, 'EEEE, d MMMM yyyy')}
            </p>
          )}
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={cycleClockMode}
              title="Klik untuk beralih simulasi waktu (Sore 15:25 / Sore Pulang 17:01 / Pagi 07:45)"
              className={`font-mono text-xl font-medium px-3 py-1 rounded-md border-2 border-foreground tabular-nums cursor-pointer transition-colors ${
                simulated
                  ? 'bg-destructive text-destructive-foreground'
                  : 'bg-accent text-foreground'
              }`}
              aria-label="Jam saat ini"
            >
              {fmtClock(now)}
            </button>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Keluar"
              className="lg:hidden p-2 rounded-md border-2 border-foreground hover:bg-secondary cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="px-5 lg:px-10 py-8 max-w-[1280px]">{children}</main>
      </div>

      <nav
        aria-label="Menu utama"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 flex overflow-x-auto no-scrollbar bg-sidebar text-sidebar-foreground border-t-2 border-foreground"
      >
        {nav.map(({ id, label, icon: Icon }) => {
          const active = page === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              aria-current={active ? 'page' : undefined}
              className={`flex-1 min-w-[72px] flex flex-col items-center gap-1 py-3 text-xs font-bold cursor-pointer ${
                active ? 'text-accent' : 'text-sidebar-foreground/70'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
export default Shell;
