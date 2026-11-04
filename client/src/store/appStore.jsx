import React, { useEffect, useMemo, useState } from 'react';
import { StoreContext, dateKey, isWeekendDate, summarize } from '../utils/formatters';
import { offsetMeters } from '../utils/geo';
import { attendanceService, journalService } from '../services/api';

// Catatan: Akan diubah menjadi true pada akhir proyek setelah seluruh halaman (Karyawan, Admin, Super Admin) selesai
export const REALTIME_CLOCK_ONLY = false;

const INITIAL_TENANTS = [
  {
    id: 't-nlg',
    code: 'NLG',
    name: 'PT Nusantara Logistik',
    licenseKey: 'HDR-9N2K-7810-44AC',
    maxUsers: 25,
    createdAt: '2024-01-15',
    activeUntil: '2027-06-30',
    suspended: false,
    qrSecret: 'nlg-secret-2026',
    workStart: '08:00',
    workEnd: '17:00',
    graceMin: 10,
    office: {
      address: 'Jl. Jend. Sudirman Kav. 52, Jakarta Selatan',
      lat: -6.22972,
      lng: 106.82609,
      radius: 50,
      ipPrefix: '103.144.12.',
    },
  },
  {
    id: 't-kps',
    code: 'KPS',
    name: 'CV Kopi Senja',
    licenseKey: 'HDR-4K8P-2209-19DF',
    maxUsers: 15,
    createdAt: '2024-06-10',
    activeUntil: '2026-12-15',
    suspended: false,
    qrSecret: 'kps-secret-2026',
    workStart: '08:00',
    workEnd: '17:00',
    graceMin: 10,
    office: {
      address: 'Jl. Braga No. 48, Bandung',
      lat: -6.91746,
      lng: 107.60981,
      radius: 50,
      ipPrefix: '103.28.14.',
    },
  },
  {
    id: 't-bmt',
    code: 'BMT',
    name: 'PT Bima Medika Utama',
    licenseKey: 'HDR-7B3M-5512-88CE',
    maxUsers: 10,
    createdAt: '2024-10-20',
    activeUntil: '2026-10-20',
    suspended: false,
    qrSecret: 'bmt-secret-2026',
    workStart: '08:00',
    workEnd: '17:00',
    graceMin: 10,
    office: {
      address: 'Jl. Diponegoro No. 112, Surabaya',
      lat: -7.28562,
      lng: 112.73818,
      radius: 50,
      ipPrefix: '103.52.88.',
    },
  },
];

const INITIAL_USERS = [
  {
    id: 'u-hendra',
    tenantId: 't-nlg',
    nik: '3173010101800001',
    fullName: 'Hendra Wijaya',
    role: 'admin',
    position: 'Manajer HR & Operasional',
    joinedAt: '2023-01-10',
    active: true,
    mustChangePassword: false,
  },
  {
    id: 'u-dewi',
    tenantId: 't-nlg',
    nik: '3173014505950002',
    fullName: 'Dewi Lestari',
    role: 'karyawan',
    position: 'Staf Produksi',
    joinedAt: '2024-03-01',
    active: true,
    mustChangePassword: false,
  },
  {
    id: 'u-budi',
    tenantId: 't-nlg',
    nik: '3173011108930003',
    fullName: 'Budi Santoso',
    role: 'karyawan',
    position: 'Operator Gudang',
    joinedAt: '2024-06-15',
    active: true,
    mustChangePassword: true,
  },
  {
    id: 'u-rina',
    tenantId: 't-nlg',
    nik: '3173011203980005',
    fullName: 'Rina Wulandari',
    role: 'karyawan',
    position: 'Staf Administrasi Logistik',
    joinedAt: '2024-08-01',
    active: true,
    mustChangePassword: false,
  },
  {
    id: 'u-fajar',
    tenantId: 't-nlg',
    nik: '3173012507920004',
    fullName: 'Fajar Nugroho',
    role: 'karyawan',
    position: 'Koordinator Armada',
    joinedAt: '2024-04-12',
    active: true,
    mustChangePassword: false,
  },
  {
    id: 'u-ardi-off',
    tenantId: 't-nlg',
    nik: '3173010902910008',
    fullName: 'Ardiansyah Pratama',
    role: 'karyawan',
    position: 'Staf Sortir',
    joinedAt: '2023-11-01',
    leftAt: '2026-09-30',
    active: false,
    mustChangePassword: false,
  },
  // Akun lintas perusahaan (CV Kopi Senja)
  {
    id: 'u-rama-kps',
    tenantId: 't-kps',
    nik: '3273015506850010',
    fullName: 'Rama Putra',
    role: 'admin',
    position: 'HR & Operasional',
    joinedAt: '2023-05-01',
    active: true,
    mustChangePassword: false,
  },
  {
    id: 'u-siti-kps',
    tenantId: 't-kps',
    nik: '3578016104910032',
    fullName: 'Siti Aminah',
    role: 'karyawan',
    position: 'Supervisor Barista & Logistik',
    joinedAt: '2024-02-01',
    active: true,
    mustChangePassword: false,
  },
  // Riwayat kerja Rina sebelumnya di CV Kopi Senja (NIK sama)
  {
    id: 'u-rina-kps-past',
    tenantId: 't-kps',
    nik: '3173011203980005',
    fullName: 'Rina Wulandari',
    role: 'karyawan',
    position: 'Admin Gudang',
    joinedAt: '2023-02-01',
    leftAt: '2024-07-25',
    active: false,
    mustChangePassword: false,
  },
  // Akun PT Bima Medika Utama (BMT)
  {
    id: 'u-bmt-admin',
    tenantId: 't-bmt',
    nik: '3578010202820001',
    fullName: 'dr. Aditya Pratama',
    role: 'admin',
    position: 'Direktur Operasional',
    joinedAt: '2024-10-20',
    active: true,
    mustChangePassword: false,
  },
  {
    id: 'u-bmt-emp',
    tenantId: 't-bmt',
    nik: '3578014408950019',
    fullName: 'Nadia Kusuma',
    role: 'karyawan',
    position: 'Apoteker Klinik',
    joinedAt: '2024-11-01',
    active: true,
    mustChangePassword: false,
  },
];

function buildInitialAttendances(todayDate) {
  const list = [];
  const base = new Date(
    todayDate.getFullYear(),
    todayDate.getMonth(),
    todayDate.getDate()
  );

  const staffConfigs = [
    { userId: 'u-dewi', tenantId: 't-nlg', ip: '103.144.12.48', skipDays: [16, 19, 29], lateDays: [8, 20, 22, 26] },
    { userId: 'u-budi', tenantId: 't-nlg', ip: '103.144.12.51', skipDays: [12, 21], lateDays: [6, 14, 15, 23, 28] },
    { userId: 'u-rina', tenantId: 't-nlg', ip: '103.144.12.49', skipDays: [13], lateDays: [9] },
    { userId: 'u-fajar', tenantId: 't-nlg', ip: '103.144.12.55', skipDays: [7, 14, 22, 27, 30], lateDays: [6, 12, 19, 28] },
    { userId: 'u-siti-kps', tenantId: 't-kps', ip: '103.28.14.19', skipDays: [15], lateDays: [12, 27] },
  ];

  for (let i = 29; i >= 1; i -= 1) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    if (isWeekendDate(d)) continue;
    const k = dateKey(d);
    const dayNum = d.getDate();
    const isSameMonth = d.getMonth() === base.getMonth();

    for (const cfg of staffConfigs) {
      if (!isSameMonth && cfg.skipDays.includes(dayNum)) {
        continue;
      }

      const isLate =
        (!isSameMonth && cfg.lateDays.includes(dayNum)) ||
        (cfg.userId === 'u-dewi' && i === 1) ||
        (cfg.userId === 'u-budi' && (i === 1 || i === 2));

      const inMinute =
        cfg.userId === 'u-dewi'
          ? i === 2
            ? 0
            : i === 1
              ? 16
              : isLate
                ? 18
                : 2
          : isLate
            ? 17
            : 4;
      const outMinute =
        cfg.userId === 'u-dewi' ? (i === 2 ? 21 : i === 1 ? 6 : 5) : 10;
      const dist =
        cfg.userId === 'u-dewi' ? (i === 2 ? 4 : i === 1 ? 34 : 12) : 18;

      const checkIn = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        8,
        inMinute,
        0
      ).toISOString();
      const checkOut = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        17,
        outMinute,
        0
      ).toISOString();

      list.push({
        id: cfg.userId === 'u-dewi' ? `att-${k}` : `att-${cfg.userId}-${k}`,
        tenantId: cfg.tenantId,
        userId: cfg.userId,
        date: k,
        checkIn,
        checkOut,
        distance: dist,
        accuracy: 14,
        ip: cfg.ip,
        status: isLate ? 'terlambat' : 'tepat',
      });
    }
  }

  // Tambahkan presensi hari ini untuk rekan kerja lain di PT Nusantara Logistik agar Dasbor Admin hidup
  const todayKey = dateKey(base);
  list.push(
    {
      id: `att-u-rina-${todayKey}`,
      tenantId: 't-nlg',
      userId: 'u-rina',
      date: todayKey,
      checkIn: new Date(base.getFullYear(), base.getMonth(), base.getDate(), 7, 56, 0).toISOString(),
      checkOut: undefined,
      distance: 9,
      accuracy: 12,
      ip: '103.144.12.49',
      status: 'tepat',
    },
    {
      id: `att-u-budi-${todayKey}`,
      tenantId: 't-nlg',
      userId: 'u-budi',
      date: todayKey,
      checkIn: new Date(base.getFullYear(), base.getMonth(), base.getDate(), 8, 19, 0).toISOString(),
      checkOut: undefined,
      distance: 27,
      accuracy: 16,
      ip: '103.144.12.51',
      status: 'terlambat',
    }
  );

  return list;
}

function buildDefaultTodayAttendance(baseDate) {
  const todayKey = dateKey(baseDate);
  return {
    id: `att-${todayKey}`,
    tenantId: 't-nlg',
    userId: 'u-dewi',
    date: todayKey,
    checkIn: new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      8,
      1,
      0
    ).toISOString(),
    checkOut: undefined,
    distance: 11,
    accuracy: 14,
    ip: '103.144.12.48',
    status: 'tepat',
  };
}

function buildInitialJournals() {
  return [
    {
      id: 'jrn-2026-10-20',
      tenantId: 't-nlg',
      userId: 'u-dewi',
      attendanceId: 'att-2026-10-20',
      date: '2026-10-20',
      title: 'Pemeriksaan jalur konveyor gudang B',
      description: 'Memastikan sensor sortir paket berjalan normal sebelum shift pagi.',
      minutes: 150,
      status: 'selesai',
      review: 'disetujui',
      note: 'Baik.',
      reviewedAt: '2026-10-20T17:30:00.000Z',
    },
    {
      id: 'jrn-2026-10-22',
      tenantId: 't-nlg',
      userId: 'u-dewi',
      attendanceId: 'att-2026-10-22',
      date: '2026-10-22',
      title: 'Rekap stok masuk gudang A',
      description: 'Mencocokkan surat jalan dengan barang yang diterima dan memperbarui lembar stok.',
      minutes: 120,
      status: 'selesai',
      review: 'disetujui',
      note: 'Baik.',
      reviewedAt: '2026-10-22T17:15:00.000Z',
    },
    {
      id: 'jrn-2026-10-23-a',
      tenantId: 't-nlg',
      userId: 'u-dewi',
      attendanceId: 'att-2026-10-23',
      date: '2026-10-23',
      title: 'Pengemasan pesanan reguler',
      description: 'Menyiapkan dan melabeli 86 paket untuk pengiriman sore.',
      minutes: 180,
      status: 'selesai',
      review: 'disetujui',
      note: 'Baik.',
      reviewedAt: '2026-10-23T17:40:00.000Z',
    },
    {
      id: 'jrn-2026-10-23-b',
      tenantId: 't-nlg',
      userId: 'u-dewi',
      attendanceId: 'att-2026-10-23',
      date: '2026-10-23',
      title: 'Pengecekan unit forklift',
      description: 'Inspeksi rutin oli, ban, dan rem. Dua unit perlu servis lanjutan.',
      minutes: 90,
      status: 'selesai',
      review: 'disetujui',
      note: 'Baik.',
      reviewedAt: '2026-10-23T17:42:00.000Z',
    },
    {
      id: 'jrn-2026-10-26',
      tenantId: 't-nlg',
      userId: 'u-dewi',
      attendanceId: 'att-2026-10-26',
      date: '2026-10-26',
      title: 'Pengecekan unit forklift',
      description: 'Inspeksi rutin oli, ban, dan rem. Dua unit perlu servis lanjutan.',
      minutes: 90,
      status: 'selesai',
      review: 'disetujui',
      note: 'Baik.',
      reviewedAt: '2026-10-26T17:20:00.000Z',
    },
    {
      id: 'jrn-2026-10-27-a',
      tenantId: 't-nlg',
      userId: 'u-dewi',
      attendanceId: 'att-2026-10-27',
      date: '2026-10-27',
      title: 'Kalibrasi mesin produksi',
      description: 'Penyesuaian parameter mesin lini 2 sesuai SOP.',
      minutes: 150,
      status: 'selesai',
      review: 'disetujui',
      note: 'Baik.',
      reviewedAt: '2026-10-27T17:18:00.000Z',
    },
    {
      id: 'jrn-2026-10-27-b',
      tenantId: 't-nlg',
      userId: 'u-dewi',
      attendanceId: 'att-2026-10-27',
      date: '2026-10-27',
      title: 'Rekap stok masuk gudang A',
      description: 'Mencocokkan surat jalan dengan barang yang diterima dan memperbarui lembar stok.',
      minutes: 120,
      status: 'selesai',
      review: 'disetujui',
      note: 'Baik.',
      reviewedAt: '2026-10-27T17:19:00.000Z',
    },
    {
      id: 'jrn-2026-10-28',
      tenantId: 't-nlg',
      userId: 'u-dewi',
      attendanceId: 'att-2026-10-28',
      date: '2026-10-28',
      title: 'Pengemasan pesanan reguler',
      description: 'Menyiapkan dan melabeli 86 paket untuk pengiriman sore.',
      minutes: 180,
      status: 'selesai',
      review: 'disetujui',
      note: 'Baik.',
      reviewedAt: '2026-10-28T17:25:00.000Z',
    },
    {
      id: 'jrn-2026-10-30-a',
      tenantId: 't-nlg',
      userId: 'u-dewi',
      attendanceId: 'att-2026-10-30',
      date: '2026-10-30',
      title: 'Patroli area parkir dan gudang',
      description: 'Pemeriksaan keamanan dan pencatatan kendaraan keluar masuk.',
      minutes: 120,
      status: 'selesai',
      review: 'disetujui',
      note: 'Baik.',
      reviewedAt: '2026-10-30T17:12:00.000Z',
    },
    {
      id: 'jrn-2026-10-30-b',
      tenantId: 't-nlg',
      userId: 'u-dewi',
      attendanceId: 'att-2026-10-30',
      date: '2026-10-30',
      title: 'Kalibrasi mesin produksi',
      description: 'Penyesuaian parameter mesin lini 2 sesuai SOP.',
      minutes: 150,
      status: 'selesai',
      review: 'disetujui',
      note: 'Baik.',
      reviewedAt: '2026-10-30T17:14:00.000Z',
    },
    {
      id: 'jrn-2026-11-02-b',
      tenantId: 't-nlg',
      userId: 'u-dewi',
      attendanceId: 'att-2026-11-02',
      date: '2026-11-02',
      title: 'Patroli area parkir dan gudang',
      description: 'Pemeriksaan keamanan dan pencatatan kendaraan keluar masuk.',
      minutes: 200,
      status: 'selesai',
      review: 'menunggu',
    },
    {
      id: 'jrn-2026-11-02-a',
      tenantId: 't-nlg',
      userId: 'u-dewi',
      attendanceId: 'att-2026-11-02',
      date: '2026-11-02',
      title: 'Rekap stok masuk gudang A',
      description: 'Mencocokkan surat jalan dengan barang yang diterima dan memperbarui lembar stok.',
      minutes: 120,
      status: 'selesai',
      review: 'menunggu',
    },
    {
      id: 'jrn-2026-11-03-a',
      tenantId: 't-nlg',
      userId: 'u-dewi',
      attendanceId: 'att-2026-11-03',
      date: '2026-11-03',
      title: 'Rekap stok masuk gudang A',
      description: 'Mencocokkan surat jalan dengan barang yang diterima dan memperbarui lembar stok.',
      minutes: 120,
      status: 'selesai',
      review: 'menunggu',
    },
  ];
}

const INITIAL_AUDIT = [
  {
    id: 'aud-1',
    tenantId: 't-nlg',
    at: '2026-11-04T08:01:12.000Z',
    actor: 'Dewi Lestari',
    action: 'CHECK_IN_VERIFIED',
    detail: 'Presensi masuk terverifikasi (11 m dari kantor, akurasi ±14 m).',
  },
  {
    id: 'aud-2',
    tenantId: 't-nlg',
    at: '2026-11-03T17:20:00.000Z',
    actor: 'Hendra Wijaya',
    action: 'JOURNAL_APPROVED',
    detail: 'Menyetujui jurnal kerja Dewi Lestari (30 Okt 2026).',
  },
  {
    id: 'aud-3',
    tenantId: 't-nlg',
    at: '2026-10-15T09:10:00.000Z',
    actor: 'Hendra Wijaya',
    action: 'USER_CREATED',
    detail: 'Mendaftarkan akun karyawan Budi Santoso (NIK 3173••••••••0003).',
  },
];

function maskFullName(name) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0] + '•'.repeat(Math.max(2, part.length - 1)))
    .join(' ');
}

function randomTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 5; i += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `Hdr-${suffix}`;
}

export function AppStoreProvider({ children }) {
  const [clockMode, setClockMode] = useState('sore_pulang');
  const [now, setNow] = useState(() =>
    REALTIME_CLOCK_ONLY ? new Date() : new Date(2026, 10, 4, 17, 1, 4)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      if (REALTIME_CLOCK_ONLY) {
        setNow(new Date());
      } else {
        setNow((prev) => new Date(prev.getTime() + 1000));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const baseDate = useMemo(() => new Date(2026, 10, 4, 8, 1, 0), []);
  const [tenants, setTenants] = useState(INITIAL_TENANTS);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [historyAttendances] = useState(() =>
    buildInitialAttendances(baseDate)
  );
  const [todayAttendance, setTodayAttendance] = useState(() =>
    buildDefaultTodayAttendance(baseDate)
  );
  const [journals, setJournals] = useState(() => buildInitialJournals());
  const [consents, setConsents] = useState([]);
  const [audit, setAudit] = useState(INITIAL_AUDIT);

  const appendAudit = (tenantId, actor, action, detail) => {
    setAudit((prev) => [
      {
        id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tenantId,
        at: now.toISOString(),
        actor,
        action,
        detail,
      },
      ...prev,
    ]);
  };

  const changePassword = (userId, nextPassword) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, password: nextPassword, mustChangePassword: false }
          : u
      )
    );
  };

  const respondConsent = (consentId, approved) => {
    setConsents((prev) =>
      prev.map((c) =>
        c.id === consentId
          ? {
              ...c,
              status: approved ? 'APPROVED' : 'REJECTED',
              decidedAt: now.toISOString(),
            }
          : c
      )
    );
  };

  // ─── Fungsi Admin Perusahaan ───────────────────────────────────────────────

  const reviewJournal = (journalId, decision, note = '', actorName = 'Admin') => {
    const target = journals.find((j) => j.id === journalId);
    setJournals((prev) =>
      prev.map((j) =>
        j.id === journalId
          ? {
              ...j,
              review: decision,
              note: note.trim() ? note.trim() : decision === 'disetujui' ? 'Baik.' : j.note,
              reviewedAt: now.toISOString(),
            }
          : j
      )
    );
    if (target) {
      const emp = users.find((u) => u.id === target.userId);
      appendAudit(
        target.tenantId,
        actorName,
        decision === 'disetujui' ? 'JOURNAL_APPROVED' : 'JOURNAL_REJECTED',
        `${decision === 'disetujui' ? 'Menyetujui' : 'Menolak'} jurnal "${target.title}" milik ${emp?.fullName || 'karyawan'}.`
      );
    }
  };

  const createEmployee = (tenantId, { nik, fullName, position }, actorName = 'Admin') => {
    const cleanNik = String(nik || '').trim();
    const cleanName = String(fullName || '').trim();
    const cleanPos = String(position || '').trim() || 'Staf Operasional';

    if (!/^\d{16}$/.test(cleanNik)) {
      return { ok: false, error: 'NIK harus terdiri dari tepat 16 digit angka.' };
    }
    if (cleanName.length < 3) {
      return { ok: false, error: 'Nama lengkap minimal 3 karakter.' };
    }
    const tenant = tenants.find((t) => t.id === tenantId);
    if (!tenant) {
      return { ok: false, error: 'Tenant perusahaan tidak ditemukan.' };
    }
    const activeCount = users.filter((u) => u.tenantId === tenantId && u.active).length;
    if (activeCount >= tenant.maxUsers) {
      return { ok: false, error: 'Kuota lisensi perusahaan sudah penuh.' };
    }
    const dup = users.find((u) => u.tenantId === tenantId && u.nik === cleanNik);
    if (dup) {
      return { ok: false, error: 'NIK tersebut sudah terdaftar di perusahaan ini.' };
    }

    const tempPassword = randomTempPassword();
    const newUser = {
      id: `u-${Date.now()}`,
      tenantId,
      nik: cleanNik,
      fullName: cleanName,
      role: 'karyawan',
      position: cleanPos,
      joinedAt: dateKey(now),
      active: true,
      mustChangePassword: true,
      password: tempPassword,
    };

    setUsers((prev) => [...prev, newUser]);
    appendAudit(
      tenantId,
      actorName,
      'USER_CREATED',
      `Mendaftarkan karyawan baru ${cleanName} (${cleanPos}).`
    );

    return { ok: true, user: newUser };
  };

  const resetPassword = (userId, actorName = 'Admin') => {
    const tempPassword = randomTempPassword();
    const target = users.find((u) => u.id === userId);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, password: tempPassword, mustChangePassword: true }
          : u
      )
    );
    if (target) {
      appendAudit(
        target.tenantId,
        actorName,
        'PASSWORD_RESET',
        `Mereset kata sandi untuk ${target.fullName}.`
      );
    }
    return tempPassword;
  };

  const setUserActive = (userId, active, actorName = 'Admin') => {
    const target = users.find((u) => u.id === userId);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              active,
              leftAt: active ? undefined : dateKey(now),
            }
          : u
      )
    );
    if (target) {
      appendAudit(
        target.tenantId,
        actorName,
        active ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
        `${active ? 'Mengaktifkan kembali' : 'Menonaktifkan'} akun ${target.fullName}.`
      );
    }
  };

  const updateTenant = (tenantId, patch, actorName = 'Admin', summaryText = '') => {
    setTenants((prev) =>
      prev.map((t) =>
        t.id === tenantId
          ? {
              ...t,
              ...patch,
              office: patch.office ? { ...t.office, ...patch.office } : t.office,
            }
          : t
      )
    );
    if (summaryText) {
      appendAudit(tenantId, actorName, 'OFFICE_UPDATED', summaryText);
    }
  };

  const extendLicense = (tenantId, months = 12) => {
    const target = tenants.find((t) => t.id === tenantId);
    if (!target) return;

    const [y, m, d] = String(target.activeUntil).split('-').map(Number);
    const currentUntil = new Date(y, (m || 1) - 1, d || 1);
    const baseDate = currentUntil < now ? new Date(now) : currentUntil;
    const nextDate = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth() + Number(months),
      baseDate.getDate()
    );
    const nextUntil = dateKey(nextDate);

    setTenants((prev) =>
      prev.map((t) => (t.id === tenantId ? { ...t, activeUntil: nextUntil } : t))
    );
    appendAudit(
      tenantId,
      'Platform Owner',
      'LICENSE_EXTENDED',
      `Perpanjang lisensi ${months} bulan hingga ${nextUntil}.`
    );
  };

  const createTenant = ({
    name,
    code,
    maxUsers,
    activeUntil,
    adminName,
    adminNik,
  }) => {
    const cleanName = String(name || '').trim();
    const cleanCode = String(code || '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase();
    const cleanAdminName = String(adminName || '').trim();
    const cleanAdminNik = String(adminNik || '').replace(/\D/g, '');

    if (!cleanName) {
      return { ok: false, error: 'Nama perusahaan wajib diisi.' };
    }
    if (cleanCode.length < 2 || cleanCode.length > 8) {
      return {
        ok: false,
        error: 'Kode perusahaan harus 2–8 karakter huruf/angka.',
      };
    }
    if (tenants.some((t) => t.code.toUpperCase() === cleanCode)) {
      return {
        ok: false,
        error: 'Kode perusahaan sudah digunakan oleh tenant lain.',
      };
    }
    if (!cleanAdminName) {
      return { ok: false, error: 'Nama admin pertama wajib diisi.' };
    }
    if (cleanAdminNik.length !== 16) {
      return { ok: false, error: 'NIK admin pertama harus 16 digit angka.' };
    }

    const seg = () =>
      Math.random().toString(36).substring(2, 6).toUpperCase().padEnd(4, '9');
    const licenseKey = `HDR-${cleanCode.padEnd(4, 'X').slice(0, 4)}-${Math.floor(
      1000 + Math.random() * 9000
    )}-${seg()}`;
    const tenantId = `t-${cleanCode.toLowerCase()}-${Date.now()
      .toString(36)
      .slice(-3)}`;
    const createdAt = dateKey(now);
    const adminPassword = randomTempPassword();

    const newTenant = {
      id: tenantId,
      code: cleanCode,
      name: cleanName,
      licenseKey,
      maxUsers: Number(maxUsers) || 20,
      createdAt,
      activeUntil,
      suspended: false,
      qrSecret: `${cleanCode.toLowerCase()}-secret-${Date.now()}`,
      workStart: '08:00',
      workEnd: '17:00',
      graceMin: 10,
      office: {
        address: 'Belum diatur — silakan perbarui di menu Kantor',
        lat: -6.22972,
        lng: 106.82609,
        radius: 50,
        ipPrefix: '103.144.12.',
      },
    };

    const newAdmin = {
      id: `u-adm-${Date.now()}`,
      tenantId,
      nik: cleanAdminNik,
      fullName: cleanAdminName,
      role: 'admin',
      position: 'Admin Perusahaan',
      joinedAt: createdAt,
      active: true,
      mustChangePassword: true,
      password: adminPassword,
    };

    setTenants((prev) => [newTenant, ...prev]);
    setUsers((prev) => [...prev, newAdmin]);
    appendAudit(
      tenantId,
      'Platform Owner',
      'TENANT_CREATED',
      `Provisioning tenant baru ${cleanName} (${cleanCode}) dengan admin pertama ${cleanAdminName}.`
    );

    return { ok: true, tenant: newTenant, adminPassword };
  };

  const talentLookup = (requesterTenantId, nik) => {
    const records = users.filter((u) => u.nik === nik && u.role === 'karyawan');
    if (records.length === 0) {
      return { found: false };
    }
    const ownActive = records.find(
      (u) => u.tenantId === requesterTenantId && u.active
    );
    const externalRecords = records.filter((u) => u.tenantId !== requesterTenantId);
    if (ownActive && externalRecords.length === 0) {
      return { found: true, ownEmployee: true };
    }
    const primary = externalRecords[0] || records[0];
    const consent = consents.find(
      (c) => c.requesterTenantId === requesterTenantId && c.nik === nik
    );
    return {
      found: true,
      ownEmployee: false,
      maskedName: maskFullName(primary.fullName),
      consent,
    };
  };

  const requestConsent = (requesterTenantId, nik, actorName = 'Admin') => {
    const records = users.filter((u) => u.nik === nik && u.role === 'karyawan');
    if (records.length === 0) {
      return { ok: false, error: 'NIK tidak ditemukan di platform.' };
    }
    const requesterTenant = tenants.find((t) => t.id === requesterTenantId);
    const existing = consents.find(
      (c) => c.requesterTenantId === requesterTenantId && c.nik === nik
    );

    const createdAt = now.toISOString();
    if (existing) {
      setConsents((prev) =>
        prev.map((c) =>
          c.id === existing.id
            ? {
                ...c,
                status: 'PENDING',
                requestedBy: actorName,
                createdAt,
                decidedAt: undefined,
              }
            : c
        )
      );
    } else {
      setConsents((prev) => [
        {
          id: `cns-${Date.now()}`,
          nik,
          requesterTenantId,
          requesterName: requesterTenant?.name || 'Perusahaan Mitra',
          requestedBy: actorName,
          purpose: 'Verifikasi rekam jejak kehadiran untuk proses rekrutmen.',
          status: 'PENDING',
          createdAt,
        },
        ...prev,
      ]);
    }

    appendAudit(
      requesterTenantId,
      actorName,
      'CONSENT_REQUESTED',
      `Mengirim permintaan izin akses rekam jejak untuk NIK ***${nik.slice(-4)}.`
    );

    return { ok: true };
  };

  const cycleClockMode = () => {
    if (REALTIME_CLOCK_ONLY) return;
    setClockMode((prev) => {
      const next =
        prev === 'sore_pulang'
          ? 'sore_kerja'
          : prev === 'sore_kerja'
            ? 'pagi_masuk'
            : 'sore_pulang';
      if (next === 'sore_pulang') {
        setNow(new Date(2026, 10, 4, 17, 1, 4));
        setTodayAttendance((cur) => cur || buildDefaultTodayAttendance(baseDate));
      } else if (next === 'sore_kerja') {
        setNow(new Date(2026, 10, 4, 15, 25, 57));
        setTodayAttendance((cur) => cur || buildDefaultTodayAttendance(baseDate));
      } else {
        setNow(new Date(2026, 10, 4, 8, 0, 15));
        setTodayAttendance(null);
      }
      return next;
    });
  };

  const todayKey = dateKey(now);

  const attendances = useMemo(() => {
    if (todayAttendance) {
      return [...historyAttendances, todayAttendance];
    }
    return historyAttendances;
  }, [historyAttendances, todayAttendance]);

  const talentReport = (requesterTenantId, nik) => {
    const records = users.filter((u) => u.nik === nik && u.role === 'karyawan');
    if (records.length === 0) return null;
    const today = dateKey(now);
    const rows = records.map((u) => {
      const t = tenants.find((x) => x.id === u.tenantId);
      const to = u.leftAt || today;
      const fromDate = new Date(now);
      fromDate.setDate(fromDate.getDate() - 29);
      const fromKey = dateKey(fromDate);
      const start = fromKey < u.joinedAt ? u.joinedAt : fromKey;
      const s = summarize(
        attendances.filter((a) => a.userId === u.id),
        journals.filter((j) => j.userId === u.id),
        start,
        to
      );
      return {
        tenantName: t?.name || 'Perusahaan',
        position: u.position,
        from: u.joinedAt,
        to: u.leftAt,
        workdays: s.workdays,
        hadir: s.hadir,
        pctHadir: s.pctHadir,
        pctTepat: s.pctTepat,
        jurnalOk: s.jurnalOk,
      };
    });

    return {
      name: records[0].fullName,
      rows,
    };
  };

  const [outsideRadius, setOutsideRadius] = useState(false);

  const toggleLocationScenario = () => {
    setOutsideRadius((prev) => !prev);
  };

  const readLocation = async (tenant) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    if (outsideRadius) {
      const pos = offsetMeters(tenant.office.lat, tenant.office.lng, 381, 286);
      return {
        lat: pos.lat,
        lng: pos.lng,
        accuracy: 18,
        mocked: false,
        source: 'perangkat',
      };
    }
    const pos = offsetMeters(tenant.office.lat, tenant.office.lng, 9, 6);
    return {
      lat: pos.lat,
      lng: pos.lng,
      accuracy: 14,
      mocked: false,
      source: 'perangkat',
    };
  };

  const currentIp = (tenant) => `${tenant.office.ipPrefix || '103.144.12.'}48`;

  const canCheckIn = (userId) => {
    const user = users.find((u) => u.id === userId);
    const tenant = tenants.find((t) => t.id === user?.tenantId);
    if (!user || !tenant)
      return { ok: false, reason: 'Data tenant tidak ditemukan.' };
    if (isWeekendDate(now)) {
      return { ok: false, reason: 'Hari ini adalah hari libur akhir pekan.' };
    }
    const existing = attendances.find(
      (a) => a.userId === userId && a.date === todayKey
    );
    if (existing) {
      return {
        ok: false,
        reason: 'Anda sudah melakukan presensi masuk hari ini.',
      };
    }
    return { ok: true, reason: 'Presensi masuk tersedia.' };
  };

  const canCheckOut = (userId) => {
    const user = users.find((u) => u.id === userId);
    const tenant = tenants.find((t) => t.id === user?.tenantId);
    if (!user || !tenant) {
      return {
        ok: false,
        code: 'NO_TENANT',
        reason: 'Data tenant tidak ditemukan.',
      };
    }

    const todayAtt = attendances.find(
      (a) => a.userId === userId && a.date === todayKey
    );
    if (!todayAtt) {
      return {
        ok: false,
        code: 'NOT_CHECKED_IN',
        reason: 'Anda belum melakukan presensi masuk hari ini.',
      };
    }
    if (todayAtt.checkOut) {
      return {
        ok: false,
        code: 'ALREADY_CHECKED_OUT',
        reason: 'Anda sudah melakukan presensi pulang hari ini.',
      };
    }

    const [endH, endM] = tenant.workEnd.split(':').map(Number);
    const curMinutes = now.getHours() * 60 + now.getMinutes();
    const endMinutes = endH * 60 + endM;
    const hasTodayJournal = journals.some(
      (j) => j.attendanceId === todayAtt.id
    );

    if (curMinutes < endMinutes) {
      return {
        ok: false,
        code: 'BEFORE_WORK_END',
        hasTodayJournal,
        isPastWorkEnd: false,
        reason: `Check-out dibuka setelah jam kerja berakhir pukul ${tenant.workEnd}.`,
      };
    }

    return {
      ok: true,
      code: hasTodayJournal ? 'OK' : 'NEED_JOURNAL_WARNING',
      hasTodayJournal,
      isPastWorkEnd: true,
      reason: 'Jam kerja selesai. Anda bisa presensi pulang sekarang.',
    };
  };

  const checkIn = async (userId, payload) => {
    const user = users.find((u) => u.id === userId);
    const tenant = tenants.find((t) => t.id === user?.tenantId);
    const [startH, startM] = (tenant?.workStart || '08:00')
      .split(':')
      .map(Number);
    const limitMinutes = startH * 60 + startM + (tenant?.graceMin ?? 10);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const status = nowMinutes <= limitMinutes ? 'tepat' : 'terlambat';

    try {
      await attendanceService.checkIn(payload);
    } catch {
      // Fallback ke state lokal jika server backend belum dijalankan
    }

    const rec = {
      id: `att-${todayKey}`,
      tenantId: user?.tenantId || 't-nlg',
      userId,
      date: todayKey,
      checkIn: now.toISOString(),
      checkOut: undefined,
      distance: payload.distance,
      accuracy: payload.accuracy,
      lat: payload.lat,
      lng: payload.lng,
      ip: payload.ip,
      photo: payload.photo,
      status,
    };

    setTodayAttendance(rec);
    return rec;
  };

  const checkOut = async (userId, payload = {}) => {
    try {
      await attendanceService.checkOut(payload);
    } catch {
      // Fallback ke state lokal jika server backend belum dijalankan
    }

    setTodayAttendance((prev) =>
      prev && prev.userId === userId
        ? { ...prev, checkOut: now.toISOString() }
        : prev
    );
  };

  const addJournal = async (userId, attendanceId, payload) => {
    if (!payload.title?.trim() || !payload.description?.trim()) {
      return {
        ok: false,
        error: 'Judul tugas dan uraian capaian wajib diisi.',
      };
    }
    if (!(payload.minutes > 0)) {
      return {
        ok: false,
        error: 'Estimasi waktu harus lebih dari 0 menit.',
      };
    }
    const user = users.find((u) => u.id === userId);

    try {
      await journalService.createJournal({
        attendanceId,
        title: payload.title.trim(),
        description: payload.description.trim(),
        minutes: payload.minutes,
        status: payload.status || 'selesai',
      });
    } catch {
      // Fallback ke state lokal jika server backend belum dijalankan
    }

    const newJournal = {
      id: `jrn-${Date.now()}`,
      tenantId: user?.tenantId || 't-nlg',
      userId,
      attendanceId,
      date: todayKey,
      title: payload.title.trim(),
      description: payload.description.trim(),
      minutes: payload.minutes,
      status: payload.status || 'selesai',
      review: 'menunggu',
    };
    setJournals((prev) => [...prev, newJournal]);
    return { ok: true, data: newJournal };
  };

  const reviseJournal = (journalId, patch) => {
    setJournals((prev) =>
      prev.map((j) =>
        j.id === journalId ? { ...j, ...patch, review: 'menunggu' } : j
      )
    );
  };

  const value = {
    now,
    simulated: clockMode === 'sore_pulang',
    clockMode,
    cycleClockMode,
    tenants,
    users,
    attendances,
    journals,
    consents,
    audit,
    readLocation,
    toggleLocationScenario,
    currentIp,
    canCheckIn,
    canCheckOut,
    checkIn,
    checkOut,
    addJournal,
    reviseJournal,
    changePassword,
    respondConsent,
    reviewJournal,
    createEmployee,
    resetPassword,
    setUserActive,
    updateTenant,
    extendLicense,
    createTenant,
    talentLookup,
    requestConsent,
    talentReport,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}
