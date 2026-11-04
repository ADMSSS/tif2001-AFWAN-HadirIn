import React, { useEffect, useMemo, useState } from 'react';
import { StoreContext, dateKey, isWeekendDate } from '../utils/formatters';
import { offsetMeters } from '../utils/geo';
import { attendanceService, journalService } from '../services/api';

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

  // Riwayat 29 hari ke belakang (hari ini 4 Nov belum presensi masuk sehingga muncul "Anda belum presensi" seperti Gambar 1)
  for (let i = 29; i >= 1; i -= 1) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    if (isWeekendDate(d)) continue;
    const k = dateKey(d);
    const dayNum = d.getDate();

    const isSameMonth = d.getMonth() === base.getMonth();
    // Tanggal tidak hadir (putih) sesuai kalender gambar 1: tgl 21 & 30 Oktober
    if (!isSameMonth && (dayNum === 21 || dayNum === 30)) {
      continue;
    }

    // Tanggal terlambat (merah) sesuai kalender gambar 1: tgl 8, 20, 22, 26 Oktober & 3 November (i === 1)
    const isLate =
      (!isSameMonth &&
        (dayNum === 8 || dayNum === 20 || dayNum === 22 || dayNum === 26)) ||
      i === 1;

    // Khusus 2 Nov (i === 2) dan 3 Nov (i === 1) samakan persis dengan tabel Arsip Riwayat Presensi di Gambar 4:
    // Sen, 2 Nov: Masuk 08:00, Keluar 17:21 (9j 21m), Jarak 4 m, Status TEPAT
    // Sel, 3 Nov: Masuk 08:16, Keluar 17:06 (8j 50m), Jarak 34 m, Status TERLAMBAT
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

function buildInitialJournals() {
  // 3 jurnal bulan November (2 dari 2-3 Nov + 1 tambahan) dengan status menunggu sehingga tampil 0/3 JURNAL DISETUJUI
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
  const [clockMode, setClockMode] = useState('kerja'); // 'kerja' (08:01 / 15:46) | 'pulang' (17:01:40)
  const [now, setNow] = useState(() => new Date(2026, 10, 4, 8, 1, 15));

  useEffect(() => {
    const timer = setInterval(() => {
      setNow((prev) => new Date(prev.getTime() + 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const cycleClockMode = () => {
    setClockMode((prev) => {
      const next = prev === 'kerja' ? 'pulang' : 'kerja';
      if (next === 'kerja') {
        setNow(new Date(2026, 10, 4, 15, 25, 57));
      } else {
        setNow(new Date(2026, 10, 4, 17, 1, 40));
      }
      return next;
    });
  };

  const baseDate = useMemo(() => new Date(2026, 10, 4, 8, 1, 15), []);
  const [tenants] = useState(INITIAL_TENANTS);
  const [users] = useState(INITIAL_USERS);
  const [attendances, setAttendances] = useState(() =>
    buildInitialAttendances(baseDate)
  );
  const [journals, setJournals] = useState(() => buildInitialJournals());
  const [consents] = useState([]);

  const todayKey = dateKey(now);

  // Membaca lokasi GPS (prioritaskan titik dalam radius kantor ~11m, ±14m sesuai desain)
  const readLocation = async (tenant) => {
    await new Promise((resolve) => setTimeout(resolve, 450));
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

  /**
   * Menyimpan Presensi Masuk:
   * 1. Mengirim HTTP POST /api/v1/attendances/check-in ke backend database (jika backend aktif)
   * 2. Menyimpan ke state aplikasi agar tabel Riwayat Presensi & Dasbor langsung ter-update
   */
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

    setAttendances((prev) => [
      ...prev.filter((a) => !(a.userId === userId && a.date === todayKey)),
      rec,
    ]);
    return rec;
  };

  /**
   * Menyimpan Presensi Pulang:
   * 1. Mengirim HTTP POST /api/v1/attendances/check-out ke backend database
   * 2. Memperbarui checkOut pada record hari ini
   */
  const checkOut = async (userId, payload = {}) => {
    try {
      await attendanceService.checkOut(payload);
    } catch {
      // Fallback ke state lokal jika server backend belum dijalankan
    }

    setAttendances((prev) =>
      prev.map((a) =>
        a.userId === userId && a.date === todayKey
          ? { ...a, checkOut: now.toISOString() }
          : a
      )
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
    simulated: clockMode === 'pulang',
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
