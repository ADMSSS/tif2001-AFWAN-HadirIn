import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  Maximize2,
  Minimize2,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Users,
} from 'lucide-react';
import {
  QR_WINDOW_SEC,
  dateKey,
  qrPayload,
  rollingCode,
  secondsLeft,
  useClock,
  useScoped,
  windowIndex,
} from '../../utils/formatters';
import { Btn, PageHead, Panel, Pill } from '../../components/ui';

const R = 46;
const CIRC = 2 * Math.PI * R;

function QrSvgMatrix({ value }) {
  const N = 25;
  const cells = useMemo(() => {
    const grid = Array.from({ length: N }, () => Array(N).fill(false));
    const reserved = Array.from({ length: N }, () => Array(N).fill(false));

    const drawFinder = (r0, c0) => {
      for (let r = -1; r <= 7; r += 1) {
        for (let c = -1; c <= 7; c += 1) {
          const rr = r0 + r;
          const cc = c0 + c;
          if (rr >= 0 && rr < N && cc >= 0 && cc < N) {
            reserved[rr][cc] = true;
            const inOuter = r >= 0 && r <= 6 && c >= 0 && c <= 6;
            const onBorder = r === 0 || r === 6 || c === 0 || c === 6;
            const inInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
            grid[rr][cc] = inOuter && (onBorder || inInner);
          }
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(0, N - 7);
    drawFinder(N - 7, 0);

    // Alignment pattern at bottom-right
    const ar = N - 9;
    const ac = N - 9;
    for (let r = 0; r < 5; r += 1) {
      for (let c = 0; c < 5; c += 1) {
        reserved[ar + r][ac + c] = true;
        grid[ar + r][ac + c] =
          r === 0 || r === 4 || c === 0 || c === 4 || (r === 2 && c === 2);
      }
    }

    // Timing patterns
    for (let i = 8; i < N - 8; i += 1) {
      reserved[6][i] = true;
      reserved[i][6] = true;
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    // Deterministic pseudo-random data bits from payload string
    let seed = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      seed ^= value.charCodeAt(i);
      seed = Math.imul(seed, 16777619) >>> 0;
    }

    for (let r = 0; r < N; r += 1) {
      for (let c = 0; c < N; c += 1) {
        if (!reserved[r][c]) {
          seed ^= (r * 31 + c * 17) & 0xff;
          seed = Math.imul(seed ^ (seed >>> 13), 2246822507) >>> 0;
          grid[r][c] = (seed & 1) === 1;
        }
      }
    }

    return grid;
  }, [value]);

  return (
    <svg
      viewBox={`0 0 ${N + 2} ${N + 2}`}
      role="img"
      aria-label="Kode QR presensi HadirIn"
      className="w-full h-full bg-white"
      shapeRendering="crispEdges"
    >
      <rect width={N + 2} height={N + 2} fill="#ffffff" />
      {cells.map((row, rIdx) =>
        row.map((on, cIdx) =>
          on ? (
            <rect
              key={`${rIdx}-${cIdx}`}
              x={cIdx + 1}
              y={rIdx + 1}
              width={1}
              height={1}
              fill="#111611"
            />
          ) : null
        )
      )}
    </svg>
  );
}

function Ring({ frac, dark, children }) {
  return (
    <div className="relative w-[min(78vw,400px)] aspect-square">
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full -rotate-90"
        aria-hidden
      >
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          strokeWidth="2.5"
          className={dark ? 'stroke-background/20' : 'stroke-foreground/15'}
        />
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          strokeWidth="3"
          strokeLinecap="butt"
          className={
            frac < 0.34
              ? 'stroke-destructive'
              : dark
                ? 'stroke-accent'
                : 'stroke-foreground'
          }
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - frac)}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

export function AdminLayarQR({ session }) {
  const { tenant, users, attendances } = useScoped(session.tenantId);
  const { now } = useClock();
  const wrapRef = useRef(null);
  const [full, setFull] = useState(false);

  useEffect(() => {
    const onChange = () =>
      setFull(document.fullscreenElement === wrapRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFull = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
    } else {
      wrapRef.current?.requestFullscreen?.().catch(() => undefined);
    }
  };

  const ms = now.getTime();
  const code = rollingCode(tenant.qrSecret || 'nlg-secret', windowIndex(ms));
  const spaced = `${code.slice(0, 3)} ${code.slice(3)}`;
  const left = secondsLeft(ms);
  const frac = left / QR_WINDOW_SEC;

  const todayKey = dateKey(now);
  const hadir = new Set(
    attendances.filter((a) => a.date === todayKey).map((a) => a.userId)
  ).size;
  const totalAktif = users.filter(
    (u) => u.role === 'karyawan' && u.active
  ).length;

  const steps = [
    {
      icon: Smartphone,
      t: 'Buka menu Presensi',
      d: 'Karyawan membuka HadirIn di ponsel dan memilih Presensi Masuk.',
    },
    {
      icon: ScanLine,
      t: 'Pindai QR di layar ini',
      d: 'Arahkan kamera ke QR, atau ketik 6 digit kode bila kamera bermasalah.',
    },
    {
      icon: Camera,
      t: 'Foto selfie & kirim',
      d: 'Ambil foto langsung, lalu sistem memeriksa lokasi dan jaringan kantor.',
    },
  ];

  return (
    <div>
      <PageHead
        kicker="Lapis 1 · Bukti kehadiran fisik"
        title="Layar QR Kantor"
        action={
          <Btn onClick={toggleFull}>
            <Maximize2 size={18} /> Layar penuh
          </Btn>
        }
      />

      <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
        <div
          ref={wrapRef}
          className={`relative border-2 border-foreground rounded-md flex flex-col items-center justify-center text-center gap-6 p-6 sm:p-10 ${
            full
              ? 'bg-foreground text-background min-h-screen rounded-none border-0'
              : 'bg-card'
          }`}
        >
          {full && (
            <button
              type="button"
              onClick={toggleFull}
              className="absolute top-4 right-4 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest border-2 border-background/60 rounded-md px-3 py-1.5 hover:bg-background hover:text-foreground cursor-pointer"
            >
              <Minimize2 size={14} /> Keluar
            </button>
          )}
          <div>
            <p
              className={`font-mono text-[11px] uppercase tracking-[0.2em] ${
                full ? 'text-background/60' : 'text-muted-foreground'
              }`}
            >
              Kode perusahaan · {tenant.code}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">
              {tenant.name}
            </h2>
          </div>

          <Ring frac={frac} dark={full}>
            <div className="bg-white border-4 border-foreground rounded-md p-2 shadow-[10px_10px_0_0_#c9f23c] w-[78%] aspect-square">
              <QrSvgMatrix value={qrPayload(tenant.code, code)} />
            </div>
          </Ring>

          <div>
            <p
              className="font-mono font-extrabold tabular-nums tracking-[0.15em] text-5xl sm:text-7xl leading-none"
              aria-label={`Kode ${code.split('').join(' ')}`}
            >
              {spaced}
            </p>
            <p
              className={`font-mono text-sm tabular-nums mt-3 ${
                left <= 5 ? 'text-destructive' : ''
              }`}
              aria-live="off"
            >
              Berganti dalam {String(left).padStart(2, '0')} dtk
            </p>
          </div>

          <p
            className={`text-sm max-w-md ${
              full ? 'text-background/70' : 'text-muted-foreground'
            }`}
          >
            Berputar tiap {QR_WINDOW_SEC} detik · kode lama masih berlaku 1
            jendela
          </p>
        </div>

        <div className="space-y-6">
          <Panel title="Hadir hari ini" kicker="Presensi masuk" tone="accent">
            <div className="flex items-end justify-between gap-3">
              <p className="font-display text-6xl font-extrabold tabular-nums leading-none">
                {hadir}
                <span className="text-2xl opacity-60">/{totalAktif}</span>
              </p>
              <Users size={32} aria-hidden />
            </div>
            <p className="text-sm mt-3">
              karyawan aktif sudah presensi masuk pada{' '}
              {todayKey.split('-').reverse().join('/')}.
            </p>
          </Panel>

          <Panel title="Cara pakai" kicker="Untuk karyawan">
            <ol className="space-y-4">
              {steps.map((s, i) => (
                <li key={s.t} className="flex gap-3">
                  <span className="font-display font-extrabold bg-foreground text-accent w-8 h-8 rounded-sm grid place-items-center shrink-0 tabular-nums">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-display font-bold flex items-center gap-2">
                      <s.icon size={16} aria-hidden /> {s.t}
                    </p>
                    <p className="text-sm text-muted-foreground">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel title="Mengapa QR berputar?" kicker="Keamanan">
            <div className="flex items-start gap-3">
              <ShieldCheck size={22} className="shrink-0 mt-0.5" aria-hidden />
              <p className="text-sm text-muted-foreground">
                Foto atau tangkapan layar QR hanya berguna selama sekitar 30
                detik. Karyawan yang tidak berada di kantor tidak bisa memakai
                kode yang dikirim lewat chat, karena sudah kedaluwarsa sebelum
                sampai.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Pill tone="dark">Kode 6 digit</Pill>
              <Pill tone="ok">Kedaluwarsa 15 dtk</Pill>
              <Pill>Toleransi 1 jendela</Pill>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

export default AdminLayarQR;
