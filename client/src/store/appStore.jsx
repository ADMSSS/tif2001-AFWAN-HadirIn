import React, { useEffect, useMemo, useState } from 'react';
import { StoreContext, dateKey, isWeekendDate } from '../utils/formatters';

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
      lat: -6.2246,
      lng: 106.8096,
      radius: 50,
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
    if (!isSameMonth && (dayNum === 9 || dayNum === 20 || dayNum === 22 || dayNum === 30)) {
      continue;
    }

    const isLate = (!isSameMonth && (dayNum === 8 || dayNum === 26)) || i === 1;
    const checkIn = new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      8,
      isLate ? 18 : 2,
      0
    ).toISOString();
    const checkOut = new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      17,
      5,
      0
    ).toISOString();

    list.push({
      id: `att-${k}`,
      tenantId: 't-nlg',
      userId: 'u-dewi',
      date: k,
      checkIn,
      checkOut,
      distance: 14,
      status: isLate ? 'terlambat' : 'tepat',
    });
  }

  const todayKey = dateKey(base);
  const todayCheckIn = new Date(
    base.getFullYear(),
    base.getMonth(),
    base.getDate(),
    8,
    1,
    0
  ).toISOString();

  list.push({
    id: `att-${todayKey}`,
    tenantId: 't-nlg',
    userId: 'u-dewi',
    date: todayKey,
    checkIn: todayCheckIn,
    checkOut: undefined,
    distance: 12,
    status: 'tepat',
  });

  return list;
}

function buildInitialJournals(attendances, todayKey) {
  return attendances
    .filter((a) => a.date !== todayKey && a.date.slice(0, 7) === todayKey.slice(0, 7))
    .map((a, idx) => ({
      id: `jrn-${a.date}`,
      tenantId: 't-nlg',
      userId: 'u-dewi',
      attendanceId: a.id,
      date: a.date,
      title:
        idx === 0
          ? 'Verifikasi manifes pengiriman gudang utama'
          : 'Rekonsiliasi stok palet logistik harian',
      description:
        'Memastikan seluruh dokumen jalan sesuai dengan fisik barang keluar dan masuk.',
      minutes: 480,
      status: 'selesai',
      review: 'menunggu',
    }));
}

export function AppStoreProvider({ children }) {
  const [clockMode, setClockMode] = useState('sore_kerja');
  const [now, setNow] = useState(() => new Date(2026, 10, 4, 15, 25, 57));

  useEffect(() => {
    const timer = setInterval(() => {
      setNow((prev) => new Date(prev.getTime() + 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const cycleClockMode = () => {
    setClockMode((prev) => {
      const next =
        prev === 'sore_kerja'
          ? 'sore_pulang'
          : prev === 'sore_pulang'
            ? 'pagi_belum'
            : 'sore_kerja';
      if (next === 'sore_kerja') {
        setNow(new Date(2026, 10, 4, 15, 25, 57));
      } else if (next === 'sore_pulang') {
        setNow(new Date(2026, 10, 4, 17, 1, 40));
      } else {
        setNow(new Date(2026, 10, 4, 7, 45, 10));
      }
      return next;
    });
  };

  const baseDate = useMemo(() => new Date(2026, 10, 4, 15, 25, 57), []);
  const [tenants] = useState(INITIAL_TENANTS);
  const [users] = useState(INITIAL_USERS);
  const [attendances] = useState(() => buildInitialAttendances(baseDate));
  const [journals, setJournals] = useState(() =>
    buildInitialJournals(buildInitialAttendances(baseDate), dateKey(baseDate))
  );
  const [consents] = useState([]);

  const todayKey = dateKey(now);

  const effectiveAttendances = useMemo(() => {
    if (clockMode === 'pagi_belum') {
      return attendances.filter((a) => a.date !== todayKey);
    }
    return attendances;
  }, [attendances, clockMode, todayKey]);

  const canCheckIn = (userId) => {
    const user = users.find((u) => u.id === userId);
    const tenant = tenants.find((t) => t.id === user?.tenantId);
    if (!user || !tenant) return { ok: false, reason: 'Data tenant tidak ditemukan.' };
    if (isWeekendDate(now)) {
      return { ok: false, reason: 'Hari ini adalah hari libur akhir pekan.' };
    }
    const existing = effectiveAttendances.find(
      (a) => a.userId === userId && a.date === todayKey
    );
    if (existing) {
      return { ok: false, reason: 'Anda sudah melakukan presensi masuk hari ini.' };
    }
    return { ok: true, reason: 'Presensi masuk tersedia.' };
  };

  const canCheckOut = (userId) => {
    const user = users.find((u) => u.id === userId);
    const tenant = tenants.find((t) => t.id === user?.tenantId);
    if (!user || !tenant) {
      return { ok: false, code: 'NO_TENANT', reason: 'Data tenant tidak ditemukan.' };
    }

    const todayAtt = effectiveAttendances.find(
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
    const hasTodayJournal = journals.some((j) => j.attendanceId === todayAtt.id);

    if (curMinutes < endMinutes) {
      return {
        ok: false,
        code: 'BEFORE_WORK_END',
        hasTodayJournal,
        isPastWorkEnd: false,
        reason: `Check-out dibuka setelah jam kerja berakhir pukul ${tenant.workEnd}.`,
      };
    }

    if (!hasTodayJournal) {
      return {
        ok: false,
        code: 'NEED_JOURNAL_FIRST',
        hasTodayJournal: false,
        isPastWorkEnd: true,
        reason:
          'Jam kerja selesai. Anda wajib mengisi jurnal kerja hari ini terlebih dahulu sebelum presensi pulang.',
      };
    }

    return {
      ok: true,
      code: 'OK',
      hasTodayJournal: true,
      isPastWorkEnd: true,
      reason: 'Jam kerja selesai. Anda bisa presensi pulang sekarang.',
    };
  };

  const addJournal = (userId, attendanceId, payload) => {
    if (!payload.title?.trim() || !payload.description?.trim()) {
      return { ok: false, error: 'Judul tugas dan uraian capaian wajib diisi.' };
    }
    if (!(payload.minutes > 0)) {
      return { ok: false, error: 'Estimasi waktu harus lebih dari 0 menit.' };
    }
    const user = users.find((u) => u.id === userId);
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
    attendances: effectiveAttendances,
    journals,
    consents,
    canCheckIn,
    canCheckOut,
    addJournal,
    reviseJournal,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}
