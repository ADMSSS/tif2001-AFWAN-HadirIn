import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  CameraOff,
  Check,
  Clock,
  Loader2,
  MapPin,
  Navigation,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';
import { fmtClock, fmtDate, fmtTime, useClock, useStore } from '../../utils/formatters';
import { validateLocation } from '../../utils/geo';
import { Btn } from '../../components/ui';

const MAX_PHOTO = 640;

function useFrontCamera(attempt) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState(() =>
    navigator.mediaDevices?.getUserMedia ? 'starting' : 'error'
  );
  const [error, setError] = useState(() =>
    navigator.mediaDevices?.getUserMedia
      ? ''
      : 'Browser tidak mendukung kamera, atau halaman tidak memakai HTTPS.'
  );

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      return undefined;
    }
    let cancelled = false;
    let stream;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'user' } }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        const v = videoRef.current;
        if (v) {
          v.srcObject = s;
          v.play().catch(() => undefined);
        }
        setStatus('ready');
      })
      .catch((e) => {
        if (cancelled) return;
        const n = e instanceof DOMException ? e.name : '';
        setError(
          n === 'NotAllowedError'
            ? 'Izin kamera ditolak. Aktifkan di pengaturan browser.'
            : n === 'NotFoundError'
              ? 'Perangkat tidak memiliki kamera.'
              : 'Kamera tidak dapat dibuka.'
        );
        setStatus('error');
      });
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [attempt]);

  return { videoRef, status, error, setStatus };
}

function fallbackPhoto() {
  const c = document.createElement('canvas');
  c.width = 480;
  c.height = 480;
  const g = c.getContext('2d');
  g.fillStyle = '#e9e5d3';
  g.fillRect(0, 0, 480, 480);
  g.fillStyle = '#122017';
  g.beginPath();
  g.arc(240, 190, 80, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.ellipse(240, 460, 150, 130, 0, Math.PI, 0);
  g.fill();
  g.fillStyle = '#c9f23c';
  g.font = 'bold 44px monospace';
  g.textAlign = 'center';
  g.fillText('FOTO', 240, 215);
  return c.toDataURL('image/jpeg', 0.7);
}

function CameraScreen({ onCancel, onShot, sending }) {
  const [attempt, setAttempt] = useState(0);
  const { videoRef, status, error, setStatus } = useFrontCamera(attempt);

  const retryCamera = () => {
    if (navigator.mediaDevices?.getUserMedia) {
      setStatus('starting');
    }
    setAttempt((a) => a + 1);
  };

  const capture = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const scale = Math.min(
      1,
      MAX_PHOTO / Math.max(v.videoWidth, v.videoHeight)
    );
    const c = document.createElement('canvas');
    c.width = Math.round(v.videoWidth * scale);
    c.height = Math.round(v.videoHeight * scale);
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(v, 0, 0, c.width, c.height);
    onShot(c.toDataURL('image/jpeg', 0.75));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Verifikasi kamera"
      className="fixed inset-0 z-50 bg-foreground text-background flex flex-col"
    >
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover -scale-x-100"
      />

      <div
        className="absolute inset-0 grid place-items-center pointer-events-none"
        aria-hidden
      >
        <div className="relative size-[min(74vw,320px)] rounded-full border-4 border-accent shadow-[0_0_0_100vmax_rgba(17,22,17,0.72)]">
          <span className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-accent pb-3">
            Wajah di sini
          </span>
          <span className="absolute inset-3 rounded-full border-2 border-dashed border-background/40" />
        </div>
      </div>

      <header className="relative flex items-center justify-between p-4 pt-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">
            Langkah 2 dari 2
          </p>
          <h2 className="font-display text-xl font-extrabold leading-tight">
            Verifikasi Wajah
          </h2>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={sending}
          aria-label="Batal dan kembali"
          className="size-11 rounded-full border-2 border-background grid place-items-center bg-foreground/60 focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40 cursor-pointer"
        >
          <X size={20} />
        </button>
      </header>

      {status !== 'ready' && (
        <div className="relative flex-1 grid place-items-center p-8 text-center">
          {status === 'starting' ? (
            <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest">
              <Loader2 className="animate-spin" size={16} /> Membuka kamera
            </span>
          ) : (
            <div className="bg-foreground border-2 border-background rounded-md p-5 max-w-xs z-10">
              <CameraOff className="mx-auto" size={28} />
              <p className="mt-2 text-sm">{error}</p>
              <div className="mt-4 flex flex-col gap-2">
                <Btn
                  variant="accent"
                  size="sm"
                  onClick={retryCamera}
                >
                  <RefreshCw size={14} /> Coba lagi
                </Btn>
                <button
                  type="button"
                  onClick={() => onShot(fallbackPhoto())}
                  className="text-sm underline underline-offset-4 text-accent font-bold py-1 cursor-pointer"
                >
                  Pakai foto contoh
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {status === 'ready' && <div className="flex-1" />}

      <footer className="relative p-4 pb-6 bg-foreground border-t-2 border-background/20">
        <p className="text-center text-sm mb-3 flex items-center justify-center gap-2">
          <ShieldCheck size={16} className="text-accent shrink-0" /> Posisikan
          wajah di dalam frame untuk verifikasi HRD
        </p>
        <button
          type="button"
          onClick={capture}
          disabled={status !== 'ready' || sending}
          className="w-full flex items-center justify-center gap-2 bg-accent text-accent-foreground font-display font-extrabold text-lg rounded-md border-2 border-background py-4 shadow-[4px_4px_0_0_#efece1] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#efece1] transition-all disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background cursor-pointer"
        >
          {sending ? (
            <>
              <Loader2 className="animate-spin" size={20} /> Mengirim…
            </>
          ) : (
            <>
              <Camera size={20} /> Ambil Foto &amp; Kirim
            </>
          )}
        </button>
      </footer>
    </div>
  );
}

function Radar({ tenant, reading, distance, ok }) {
  const { office } = tenant;
  const dy = (reading.lat - office.lat) * 111320;
  const dx =
    (reading.lng - office.lng) *
    111320 *
    Math.cos((office.lat * Math.PI) / 180);
  const extent = Math.max(
    office.radius * 1.5,
    distance * 1.15,
    reading.accuracy * 1.1
  );
  const S = 100 / extent;
  const px = 120 + dx * S;
  const py = 120 - dy * S;
  const dot = ok ? 'fill-foreground' : 'fill-destructive';

  return (
    <svg
      viewBox="0 0 240 240"
      className="w-full max-h-60 border-2 border-foreground rounded-md bg-card"
      role="img"
      aria-label={`Posisi Anda ${Math.round(distance)} meter dari kantor, radius ${office.radius} meter`}
    >
      <line
        x1="120"
        y1="8"
        x2="120"
        y2="232"
        stroke="currentColor"
        strokeOpacity="0.12"
      />
      <line
        x1="8"
        y1="120"
        x2="232"
        y2="120"
        stroke="currentColor"
        strokeOpacity="0.12"
      />
      <circle
        cx="120"
        cy="120"
        r={office.radius * S}
        className="fill-accent"
        fillOpacity="0.55"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="120" cy="120" r="4" className="fill-foreground" />
      <text
        x="120"
        y={Math.max(14, 120 - office.radius * S - 6)}
        textAnchor="middle"
        className="fill-foreground"
        fontSize="9"
        fontFamily="monospace"
      >
        KANTOR · {office.radius} m
      </text>
      <circle
        cx={px}
        cy={py}
        r={Math.max(6, reading.accuracy * S)}
        className={dot}
        fillOpacity="0.14"
      />
      <line
        x1="120"
        y1="120"
        x2={px}
        y2={py}
        stroke="currentColor"
        strokeOpacity="0.5"
        strokeDasharray="3 3"
      />
      <circle
        cx={px}
        cy={py}
        r="6"
        className={dot}
        stroke="currentColor"
        strokeWidth="2"
      />
      <text
        x={Math.min(Math.max(px, 20), 220)}
        y={py < 20 ? py + 20 : py - 11}
        textAnchor="middle"
        className="fill-foreground"
        fontSize="10"
        fontWeight="bold"
        fontFamily="monospace"
      >
        ANDA
      </text>
    </svg>
  );
}

export function AttendanceFlow({ mode, tenant, userId, onDone }) {
  const { readLocation, currentIp, checkIn, checkOut } = useStore();
  const { now } = useClock();
  const [loc, setLoc] = useState({ phase: 'loading' });
  const [locAttempt, setLocAttempt] = useState(0);
  const [camera, setCamera] = useState(false);
  const [sending, setSending] = useState(false);

  const run = useCallback(() => {
    setLoc({ phase: 'loading' });
    setLocAttempt((a) => a + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    readLocation(tenant)
      .then((reading) => {
        if (cancelled) return;
        const ip = currentIp(tenant);
        setLoc({
          phase: 'done',
          reading,
          ip,
          result: validateLocation(tenant.office, reading, ip),
        });
      })
      .catch(() => {
        if (cancelled) return;
        setLoc({
          phase: 'error',
          error:
            'Izin lokasi ditolak atau lokasi tidak tersedia di perangkat ini.',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [locAttempt, readLocation, currentIp, tenant]);

  const { result, reading, ip } = loc;
  const inside = loc.phase === 'done' && Boolean(result?.ok);
  const failed = result?.checks.filter((c) => !c.ok) ?? [];
  const radiusFail = result
    ? !result.checks.find((c) => c.id === 'radius')?.ok
    : false;

  const submit = async (photo) => {
    if (sending || !reading || !result || !ip) return;
    setSending(true);
    const payload = {
      lat: reading.lat,
      lng: reading.lng,
      distance: Math.round(result.distance),
      accuracy: Math.round(reading.accuracy),
      ip,
      photo,
    };

    try {
      const at = new Date(now);
      if (mode === 'masuk') {
        await checkIn(userId, payload);
      } else {
        await checkOut(userId, payload);
      }
      setSending(false);
      setCamera(false);
      onDone({
        mode,
        photo,
        at,
        lat: reading.lat,
        lng: reading.lng,
        distance: Math.round(result.distance),
        accuracy: Math.round(reading.accuracy),
        officeName: tenant.name,
        radius: tenant.office.radius,
      });
    } catch {
      setSending(false);
    }
  };

  const label = mode === 'masuk' ? 'Mulai Absen' : 'Mulai Absen Pulang';

  return (
    <div className="max-w-md mx-auto">
      <section
        aria-live="polite"
        className="border-2 border-foreground rounded-md bg-card overflow-hidden shadow-[6px_6px_0_0_#111611]"
      >
        <div className="px-4 py-2.5 bg-foreground text-background flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">
            Langkah 1 dari 2 · Lokasi
          </span>
          <span className="font-mono text-[10px] tabular-nums opacity-70">
            {fmtClock(now)}
          </span>
        </div>

        {loc.phase === 'loading' && (
          <div
            className="p-8 grid place-items-center text-center"
            role="status"
          >
            <Loader2 className="animate-spin" size={28} />
            <p className="mt-3 font-mono text-xs uppercase tracking-widest">
              Membaca lokasi…
            </p>
          </div>
        )}

        {loc.phase === 'error' && (
          <div className="p-5">
            <p role="alert" className="font-bold text-destructive">
              {loc.error}
            </p>
            <Btn
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => void run()}
            >
              <RefreshCw size={14} /> Coba lagi
            </Btn>
          </div>
        )}

        {loc.phase === 'done' && result && reading && (
          <div>
            <div
              className={`p-4 flex items-center gap-3 border-b-2 border-foreground ${
                inside
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-destructive text-destructive-foreground'
              }`}
            >
              <span className="size-12 rounded-full border-2 border-foreground bg-card text-foreground grid place-items-center shrink-0">
                {inside ? (
                  <Check size={24} strokeWidth={3} />
                ) : (
                  <ShieldAlert size={22} />
                )}
              </span>
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] opacity-70">
                  Status lokasi
                </p>
                <h2 className="font-display text-2xl font-extrabold leading-tight">
                  {inside ? 'Di Dalam Radius Kantor' : 'Diluar Radius'}
                </h2>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <Radar
                tenant={tenant}
                reading={reading}
                distance={result.distance}
                ok={inside}
              />

              <dl className="grid grid-cols-3 border-2 border-foreground rounded-md divide-x-2 divide-foreground text-center">
                {[
                  ['Jarak', `${Math.round(result.distance)} m`],
                  ['Batas', `${tenant.office.radius} m`],
                  ['Akurasi GPS', `±${Math.round(reading.accuracy)} m`],
                ].map(([k, v]) => (
                  <div key={k} className="py-2.5 px-1">
                    <dt className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                      {k}
                    </dt>
                    <dd className="font-display text-xl font-extrabold tabular-nums">
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="font-mono text-[11px] text-muted-foreground flex items-center gap-1.5 tabular-nums">
                <Navigation size={12} /> {reading.lat.toFixed(5)},{' '}
                {reading.lng.toFixed(5)}
              </p>

              {!inside && (
                <div
                  role="alert"
                  className="border-2 border-foreground rounded-md bg-secondary p-3 text-sm"
                >
                  <p className="font-bold">
                    {radiusFail
                      ? 'Anda berada di luar area kantor.'
                      : 'Validasi lokasi belum lolos.'}
                  </p>
                  <ul className="mt-1 space-y-0.5 text-muted-foreground">
                    {failed.map((c) => (
                      <li key={c.id}>
                        • {c.label}: {c.detail}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <div className="mt-5 space-y-3">
        <button
          type="button"
          disabled={!inside}
          onClick={() => setCamera(true)}
          className="w-full flex items-center justify-center gap-2 bg-foreground text-accent font-display font-extrabold text-lg rounded-md border-2 border-foreground py-4 shadow-[4px_4px_0_0_#c9f23c] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#c9f23c] transition-all disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer"
        >
          <Camera size={20} /> {label}
        </button>
        {!inside && loc.phase === 'done' && (
          <p className="text-center text-xs text-muted-foreground">
            Tombol aktif setelah Anda berada di dalam radius kantor.
          </p>
        )}
        <Btn
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => void run()}
          disabled={loc.phase === 'loading'}
        >
          <RefreshCw size={14} /> Periksa ulang lokasi
        </Btn>
      </div>

      {camera && (
        <CameraScreen
          sending={sending}
          onCancel={() => setCamera(false)}
          onShot={submit}
        />
      )}
    </div>
  );
}

function PinMap({ r }) {
  return (
    <div
      className="relative h-28 border-2 border-foreground rounded-md overflow-hidden bg-secondary"
      role="img"
      aria-label={`Lokasi presensi ${r.lat.toFixed(5)}, ${r.lng.toFixed(5)}`}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 200 112"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <path
          d="M-10 78 L90 60 L210 84"
          stroke="#111611"
          strokeOpacity=".25"
          strokeWidth="9"
          fill="none"
        />
        <path
          d="M70 -10 L84 60 L62 125"
          stroke="#111611"
          strokeOpacity=".25"
          strokeWidth="7"
          fill="none"
        />
        <path
          d="M130 -10 L150 40 L210 30"
          stroke="#111611"
          strokeOpacity=".15"
          strokeWidth="5"
          fill="none"
        />
        <rect
          x="100"
          y="8"
          width="40"
          height="22"
          fill="#111611"
          fillOpacity=".08"
        />
        <rect
          x="8"
          y="12"
          width="46"
          height="30"
          fill="#111611"
          fillOpacity=".08"
        />
        <circle
          cx="100"
          cy="56"
          r="34"
          className="fill-accent"
          fillOpacity=".5"
          stroke="#111611"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
      </svg>
      <span className="absolute left-1/2 top-[50%] -translate-x-1/2 -translate-y-full grid place-items-center">
        <MapPin
          size={34}
          className="fill-foreground text-accent"
          strokeWidth={2}
        />
      </span>
      <span className="absolute left-1/2 top-[50%] -translate-x-1/2 w-3 h-1 rounded-full bg-foreground/50" />
      <span className="absolute bottom-1.5 left-1.5 bg-card border-2 border-foreground rounded-sm px-1.5 py-0.5 font-mono text-[10px] tabular-nums">
        {r.lat.toFixed(5)}, {r.lng.toFixed(5)}
      </span>
    </div>
  );
}

export function ReceiptModal({ r, onClose }) {
  const btn = useRef(null);
  useEffect(() => btn.current?.focus(), []);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rcp-title"
      className="fixed inset-0 z-[60] bg-foreground/80 flex items-end sm:items-center justify-center p-3"
    >
      <div className="w-full max-w-sm bg-card border-2 border-foreground rounded-md shadow-[6px_6px_0_0_#c9f23c] overflow-hidden max-h-[96vh] overflow-y-auto">
        <div className="bg-accent text-accent-foreground p-4 border-b-2 border-foreground flex items-center gap-3">
          <span className="size-10 rounded-full bg-foreground text-accent grid place-items-center shrink-0">
            <Check size={22} strokeWidth={3} />
          </span>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] opacity-70">
              Presensi {r.mode} terkirim
            </p>
            <h2
              id="rcp-title"
              className="font-display text-2xl font-extrabold leading-tight"
            >
              Berhasil dikirim
            </h2>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-4 items-center">
            <img
              src={r.photo}
              alt="Foto presensi Anda"
              className="size-24 rounded-full border-2 border-foreground object-cover shrink-0 bg-secondary"
            />
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1">
                <Clock size={11} /> Waktu presensi
              </p>
              <p className="font-display text-4xl font-extrabold tabular-nums leading-none mt-1">
                {fmtTime(r.at.toISOString())}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {fmtDate(r.at, 'EEE, d MMM')} {r.at.getFullYear()}
              </p>
            </div>
          </div>

          <PinMap r={r} />
          <p className="text-sm -mt-2">
            <span className="font-bold">{r.officeName}</span> · {r.distance} m
            dari titik kantor (radius {r.radius} m) · ±{r.accuracy} m
          </p>

          <div className="border-2 border-foreground rounded-md p-3 bg-secondary flex gap-3 items-start">
            <span className="relative flex size-3 mt-1.5 shrink-0">
              <span className="absolute inset-0 rounded-full bg-destructive/50 animate-ping" />
              <span className="relative size-3 rounded-full bg-destructive border border-foreground" />
            </span>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Status
              </p>
              <p className="font-display text-lg font-extrabold leading-tight">
                Menunggu Verifikasi HRD
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Admin perusahaan akan memeriksa foto dan lokasi Anda. Catatan
                terkunci untuk audit.
              </p>
            </div>
          </div>

          <button
            ref={btn}
            type="button"
            onClick={onClose}
            className="w-full bg-foreground text-accent font-display font-extrabold rounded-md border-2 border-foreground py-3.5 shadow-[4px_4px_0_0_#c9f23c] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#c9f23c] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
