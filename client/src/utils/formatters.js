import { createContext, useContext } from 'react';

const ID_MONTHS_LONG = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const ID_MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

const ID_DAYS_LONG = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

const ID_DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export function parseDateISO(str) {
  if (!str) return new Date();
  if (str instanceof Date) return str;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d, 8, 0, 0);
  }
  return new Date(str);
}

export function dateKey(d) {
  const dt = d instanceof Date ? d : parseDateISO(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isWeekendDate(d) {
  const day = d.getDay();
  return day === 0 || day === 6;
}

export function diffMinutes(later, earlier) {
  const a = later instanceof Date ? later : new Date(later);
  const b = earlier instanceof Date ? earlier : new Date(earlier);
  return Math.max(0, Math.round((a.getTime() - b.getTime()) / 60000));
}

export function fmtDate(key, pattern = 'd MMM yyyy') {
  const d = parseDateISO(key);
  const dayNum = d.getDate();
  const monthIdx = d.getMonth();
  const year = d.getFullYear();
  const dayIdx = d.getDay();

  if (pattern === 'EEEE, d MMMM yyyy') {
    return `${ID_DAYS_LONG[dayIdx]}, ${dayNum} ${ID_MONTHS_LONG[monthIdx]} ${year}`;
  }
  if (pattern === 'EEE, d MMM') {
    return `${ID_DAYS_SHORT[dayIdx]}, ${dayNum} ${ID_MONTHS_SHORT[monthIdx]}`;
  }
  if (pattern === 'EEE d MMM') {
    return `${ID_DAYS_SHORT[dayIdx]} ${dayNum} ${ID_MONTHS_SHORT[monthIdx]}`;
  }
  if (pattern === 'd MMMM yyyy') {
    return `${dayNum} ${ID_MONTHS_LONG[monthIdx]} ${year}`;
  }
  if (pattern === 'd MMMM') {
    return `${dayNum} ${ID_MONTHS_LONG[monthIdx]}`;
  }
  if (pattern === 'MMMM yyyy') {
    return `${ID_MONTHS_LONG[monthIdx]} ${year}`;
  }
  if (pattern === 'MMM yyyy') {
    return `${ID_MONTHS_SHORT[monthIdx]} ${year}`;
  }
  if (pattern === 'd MMMM yyyy, HH:mm') {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${dayNum} ${ID_MONTHS_LONG[monthIdx]} ${year}, ${hh}:${mm}`;
  }
  if (pattern === 'd MMM') {
    return `${dayNum} ${ID_MONTHS_SHORT[monthIdx]}`;
  }
  if (pattern === 'd') {
    return String(dayNum);
  }
  return `${dayNum} ${ID_MONTHS_SHORT[monthIdx]} ${year}`;
}

export function fmtClock(d) {
  const dt = d instanceof Date ? d : new Date(d);
  const hh = String(dt.getHours()).padStart(2, '0');
  const mm = String(dt.getMinutes()).padStart(2, '0');
  const ss = String(dt.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export const fmtTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const maskNik = (nik = '') =>
  `${nik.slice(0, 4)}••••••••${nik.slice(-4)}`;

export const hm = (mins) =>
  `${Math.floor(mins / 60)}j ${String(Math.round(mins % 60)).padStart(2, '0')}m`;

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

export const inputCls =
  'w-full bg-transparent outline-none placeholder:text-muted-foreground/70';

export const thCls =
  'text-left px-4 py-3 font-mono text-[11px] uppercase tracking-widest';
export const theadCls = 'bg-foreground text-background';

export function workdaysBetween(from, to) {
  if (from > to) return 0;
  const start = parseDateISO(from);
  const end = parseDateISO(to);
  let count = 0;
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cur <= last) {
    if (!isWeekendDate(cur)) count += 1;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export function summarize(atts, journals, from, to) {
  const workdays = Math.max(1, workdaysBetween(from, to));
  const inRange = atts.filter((a) => a.date >= from && a.date <= to);
  const hadir = inRange.length;
  const tepat = inRange.filter((a) => a.status === 'tepat').length;
  const terlambat = hadir - tepat;
  const mins = inRange
    .filter((a) => a.checkOut)
    .map((a) => diffMinutes(a.checkOut, a.checkIn));
  const jam = mins.reduce((s, m) => s + m, 0) / 60;
  const ids = new Set(inRange.map((a) => a.id));
  const jr = journals.filter((j) => ids.has(j.attendanceId));
  return {
    workdays,
    hadir,
    tepat,
    terlambat,
    alpa: Math.max(0, workdays - hadir),
    pctHadir: Math.min(100, Math.round((hadir / workdays) * 100)),
    pctTepat: hadir ? Math.round((tepat / hadir) * 100) : 0,
    jam: Math.round(jam),
    jurnal: jr.length,
    jurnalOk: jr.filter((j) => j.review === 'disetujui').length,
  };
}

export const StoreContext = createContext(null);

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore harus digunakan di dalam AppStoreProvider');
  }
  return ctx;
}

export function useClock() {
  const { now, simulated, clockMode, cycleClockMode } = useStore();
  return { now, simulated, clockMode, cycleClockMode };
}
