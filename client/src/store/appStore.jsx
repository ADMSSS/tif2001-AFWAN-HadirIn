import React, { useEffect, useMemo, useState } from 'react';
import { StoreContext, dateKey, isWeekendDate } from '../utils/formatters';
import { offsetMeters } from '../utils/geo';
import { attendanceService, journalService } from '../services/api';

// Catatan: Akan diubah menjadi true pada akhir proyek setelah seluruh halaman (Karyawan, Admin, Super Admin) selesai
export const REALTIME_CLOCK_ONLY = false;

const INITIAL_TENANTS = [
  {
    id: 't-nlg',
    code: 'NLG',
    name: 'PT Nusantara Logistik',
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
];

const INITIAL_USERS = [
  {
    id: 'u-dewi',
    tenantId: 't-nlg',
    nik: '3173014505950002',
    fullName: 'Dewi Lestari',
    role: 'karyawan',
    position: 'Staf Produksi',
    joinedAt: '2024-03-01',
  },
  {
    id: 'u-hendra',
    tenantId: 't-nlg',
    nik: '3173011201880001',
    fullName: 'Hendra Wijaya',
    role: 'admin',
    position: 'Manajer HR & Operasional',
    joinedAt: '2023-01-10',
  },
];

function buildInitialAttendances(todayDate) {
  const list = [];
  const base = new Date(
    todayDate.getFullYear(),
    todayDate.getMonth(),
    todayDate.getDate()
  );

  for (let i = 29; i >= 1; i -= 1) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    if (isWeekendDate(d)) continue;
    const k = dateKey(d);
    const dayNum = d.getDate();

    const isSameMonth = d.getMonth() === base.getMonth();
    if (!isSameMonth && (dayNum === 16 || dayNum === 19 || dayNum === 29)) {
      continue;
    }

    const isLate =
      (!isSameMonth && (dayNum === 8 || dayNum === 20 || dayNum === 22 || dayNum === 26)) ||
      i === 1;

    const inMinute = i === 2 ? 0 : i === 1 ? 16 : isLate ? 18 : 2;
    const outMinute = i === 2 ? 21 : i === 1 ? 6 : 5;
    const dist = i === 2 ? 4 : i === 1 ? 34 : 12;

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
      id: `att-${k}`,
      tenantId: 't-nlg',
      userId: 'u-dewi',
      date: k,
      checkIn,
      checkOut,
      distance: dist,
      status: isLate ? 'terlambat' : 'tepat',
    });
  }

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
    status: 'tepat',
  };
}

function buildInitialJournals() {
  return [
    {
      id: 'jrn-2026-11-02-a',
      tenantId: 't-nlg',
      userId: 'u-dewi',
      attendanceId: 'att-2026-11-02',
      date: '2026-11-02',
      title: 'Verifikasi manifes pengiriman gudang utama',
      description:
        'Memastikan seluruh dokumen jalan sesuai dengan fisik barang keluar dan masuk.',
      minutes: 240,
      status: 'selesai',
      review: 'menunggu',
    },
    {
      id: 'jrn-2026-11-02-b',
      tenantId: 't-nlg',
      userId: 'u-dewi',
      attendanceId: 'att-2026-11-02',
      date: '2026-11-02',
      title: 'Audit inventaris palet sektor B',
      description: 'Pengecekan berkala ketersediaan palet kayu dan plastik.',
      minutes: 240,
      status: 'selesai',
      review: 'menunggu',
    },
    {
      id: 'jrn-2026-11-03-a',
      tenantId: 't-nlg',
      userId: 'u-dewi',
      attendanceId: 'att-2026-11-03',
      date: '2026-11-03',
      title: 'Rekonsiliasi stok palet logistik harian',
      description:
        'Mencocokkan surat jalan armada sore dengan catatan keluar gudang.',
      minutes: 480,
      status: 'selesai',
      review: 'menunggu',
    },
  ];
}

export function AppStoreProvider({ children }) {
  // 3 skenario waktu untuk pengujian UI:
  // 'sore_pulang' (17:01:04 - sudah presensi masuk 08:01, muncul banner jurnal & tombol Presensi pulang)
  // 'sore_kerja'  (15:25:57 - sudah presensi masuk 08:01, masih jam kerja)
  // 'pagi_masuk'  (08:00:15 - belum presensi masuk, siap tes kamera & radar)
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
  const [tenants] = useState(INITIAL_TENANTS);
  const [users] = useState(INITIAL_USERS);
  const [historyAttendances] = useState(() =>
    buildInitialAttendances(baseDate)
  );
  // Menyimpan presensi hari ini; pada mode sore_kerja & sore_pulang otomatis terisi Bekerja sejak 08:01
  const [todayAttendance, setTodayAttendance] = useState(() =>
    buildDefaultTodayAttendance(baseDate)
  );
  const [journals, setJournals] = useState(() => buildInitialJournals());
  const [consents] = useState([]);

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

  const readLocation = async (tenant) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
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
    readLocation,
    currentIp,
    canCheckIn,
    canCheckOut,
    checkIn,
    checkOut,
    addJournal,
    reviseJournal,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}
