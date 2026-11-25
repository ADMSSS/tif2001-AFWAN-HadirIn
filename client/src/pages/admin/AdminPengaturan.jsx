import React, { useState } from 'react';
import {
  Camera,
  Crosshair,
  Globe2,
  KeyRound,
  Loader2,
  MapPin,
  QrCode,
  RotateCcw,
  Save,
} from 'lucide-react';
import { fmtDate, inputCls, useScoped, useStore } from '../../utils/formatters';
import { Btn, Field, PageHead, Panel, Pill } from '../../components/ui';

const num = (s) =>
  String(s || '').trim() === '' ? NaN : Number(String(s).replace(',', '.'));

function RadiusViz({ radius }) {
  const r = 8 + (radius / 200) * 38;
  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full max-w-[160px]"
      role="img"
      aria-label={`Lingkaran geofence radius ${radius} meter`}
    >
      <rect
        x="1"
        y="1"
        width="98"
        height="98"
        rx="4"
        className="fill-card stroke-foreground"
        strokeWidth="2"
      />
      <path
        d="M0 33H100M0 66H100M33 0V100M66 0V100"
        className="stroke-foreground/10"
        strokeWidth="1"
      />
      <circle
        cx="50"
        cy="50"
        r={r}
        className="fill-accent/50 stroke-foreground"
        strokeWidth="2"
        strokeDasharray="4 3"
        style={{ transition: 'r 150ms' }}
      />
      <rect x="46" y="46" width="8" height="8" className="fill-foreground" />
    </svg>
  );
}

export function AdminPengaturan({ session }) {
  const tenantId = session.tenantId;
  const { tenant } = useScoped(tenantId);
  const { updateTenant } = useStore();

  const initial = () => ({
    address: tenant.office.address,
    lat: String(tenant.office.lat),
    lng: String(tenant.office.lng),
    radius: tenant.office.radius,
    ipPrefix: tenant.office.ipPrefix,
    workStart: tenant.workStart,
    workEnd: tenant.workEnd,
    graceMin: String(tenant.graceMin),
  });

  const [f, setF] = useState(initial);
  const [locating, setLocating] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');

  const set = (k, v) => {
    setSavedNotice('');
    setF((s) => ({ ...s, [k]: v }));
  };

  const lat = num(f.lat);
  const lng = num(f.lng);
  const grace = num(f.graceMin);
  const errors = {};
  if (!f.address.trim()) errors.address = 'Alamat kantor wajib diisi.';
  if (!(lat >= -90 && lat <= 90))
    errors.lat = 'Latitude harus angka antara -90 dan 90.';
  if (!(lng >= -180 && lng <= 180))
    errors.lng = 'Longitude harus angka antara -180 dan 180.';
  if (!/^\d{1,3}(\.\d{1,3}){0,3}\.?$/.test(f.ipPrefix.trim()))
    errors.ipPrefix = 'Format prefiks IP, contoh 103.28.14.';
  if (!f.workStart) errors.workStart = 'Wajib diisi.';
  if (!f.workEnd || f.workEnd <= f.workStart)
    errors.workEnd = 'Jam pulang harus setelah jam masuk.';
  if (!(Number.isInteger(grace) && grace >= 0 && grace <= 120))
    errors.graceMin = 'Bilangan bulat 0–120 menit.';
  const valid = Object.keys(errors).length === 0;

  const o = tenant.office;
  const changes = [];
  if (f.address.trim() !== o.address) changes.push('Alamat kantor diperbarui');
  if (lat !== o.lat || lng !== o.lng)
    changes.push('Koordinat kantor diperbarui');
  if (f.radius !== o.radius)
    changes.push(`Radius geofence diubah ${o.radius} m → ${f.radius} m`);
  if (f.ipPrefix.trim() !== o.ipPrefix)
    changes.push(`Prefiks IP diubah ${o.ipPrefix} → ${f.ipPrefix.trim()}`);
  if (f.workStart !== tenant.workStart)
    changes.push(`Jam masuk diubah ${tenant.workStart} → ${f.workStart}`);
  if (f.workEnd !== tenant.workEnd)
    changes.push(`Jam pulang diubah ${tenant.workEnd} → ${f.workEnd}`);
  if (grace !== tenant.graceMin)
    changes.push(`Toleransi diubah ${tenant.graceMin} → ${f.graceMin} menit`);
  const dirty = changes.length > 0;

  const save = () => {
    if (!valid || !dirty) return;
    updateTenant(
      tenantId,
      {
        office: {
          address: f.address.trim(),
          lat,
          lng,
          radius: f.radius,
          ipPrefix: f.ipPrefix.trim(),
        },
        workStart: f.workStart,
        workEnd: f.workEnd,
        graceMin: grace,
      },
      session.name,
      changes.join('; ')
    );
    setSavedNotice('Pengaturan kantor disimpan dan dicatat di audit trail.');
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        setF((s) => ({
          ...s,
          lat: p.coords.latitude.toFixed(6),
          lng: p.coords.longitude.toFixed(6),
        }));
      },
      () => {
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const err = (k) =>
    errors[k] ? (
      <span
        role="alert"
        className="block text-xs text-destructive font-semibold mt-1"
      >
        {errors[k]}
      </span>
    ) : null;

  const rules = [
    {
      icon: QrCode,
      t: 'Lapis 1 · QR berputar',
      d: 'Kode 6 digit berganti tiap 15 detik; kode sebelumnya masih berlaku 1 jendela.',
    },
    {
      icon: Camera,
      t: 'Lapis 2 · Foto langsung',
      d: 'Hanya dari kamera, tanpa unggahan galeri. Dikompres maksimal 600×600 piksel.',
    },
    {
      icon: MapPin,
      t: 'Lapis 3 · Lokasi & jaringan',
      d: `Jarak Haversine ≤ ${o.radius} m dari kantor, akurasi GPS ≤ 100 m, dan IP publik berawalan ${o.ipPrefix}`,
    },
  ];

  return (
    <div>
      <PageHead
        kicker={`${tenant.name} · ${tenant.code}`}
        title="Kantor"
        action={
          dirty ? (
            <Pill tone="warn">{changes.length} perubahan belum disimpan</Pill>
          ) : (
            <Pill tone="ok">Tersimpan</Pill>
          )
        }
      />

      <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Panel title="Lokasi & geofence" kicker="Lapis 3">
            <div className="space-y-4">
              <Field label="Alamat kantor">
                <input
                  className={inputCls}
                  value={f.address}
                  onChange={(e) => set('address', e.target.value)}
                />
              </Field>
              {err('address')}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Field label="Latitude">
                    <input
                      className={`${inputCls} font-mono tabular-nums`}
                      inputMode="decimal"
                      value={f.lat}
                      onChange={(e) => set('lat', e.target.value)}
                    />
                  </Field>
                  {err('lat')}
                </div>
                <div>
                  <Field label="Longitude">
                    <input
                      className={`${inputCls} font-mono tabular-nums`}
                      inputMode="decimal"
                      value={f.lng}
                      onChange={(e) => set('lng', e.target.value)}
                    />
                  </Field>
                  {err('lng')}
                </div>
              </div>
              <Btn
                variant="ghost"
                size="sm"
                onClick={useMyLocation}
                disabled={locating}
              >
                {locating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Crosshair size={16} />
                )}{' '}
                Gunakan lokasi saya saat ini
              </Btn>

              <div className="grid sm:grid-cols-[1fr_auto] gap-5 items-center border-t-2 border-dashed border-foreground/30 pt-4">
                <div>
                  <div className="flex items-baseline justify-between">
                    <label
                      htmlFor="radius"
                      className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground"
                    >
                      Radius geofence
                    </label>
                    <span className="font-display text-3xl font-extrabold tabular-nums">
                      {f.radius}
                      <span className="text-base"> m</span>
                    </span>
                  </div>
                  <input
                    id="radius"
                    type="range"
                    min={20}
                    max={200}
                    step={5}
                    value={f.radius}
                    onChange={(e) => set('radius', Number(e.target.value))}
                    className="w-full mt-2 h-2 cursor-pointer"
                    style={{ accentColor: '#111611' }}
                  />
                  <div className="flex justify-between font-mono text-[10px] text-muted-foreground tabular-nums">
                    <span>20 m</span>
                    <span>200 m</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Bawaan 50 m. Terlalu kecil membuat karyawan di lobi ditolak;
                    terlalu besar memungkinkan presensi dari luar gedung.
                  </p>
                </div>
                <RadiusViz radius={f.radius} />
              </div>
            </div>
          </Panel>

          <Panel title="Jaringan & jam kerja" kicker="Aturan harian">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field
                  label="Prefiks IP / subnet publik kantor"
                  hint="IP publik yang dipakai Wi-Fi kantor, diakhiri titik. Contoh: 103.28.14."
                >
                  <input
                    className={`${inputCls} font-mono`}
                    value={f.ipPrefix}
                    onChange={(e) => set('ipPrefix', e.target.value)}
                  />
                </Field>
                {err('ipPrefix')}
              </div>
              <div>
                <Field label="Jam masuk">
                  <input
                    type="time"
                    className={`${inputCls} font-mono tabular-nums`}
                    value={f.workStart}
                    onChange={(e) => set('workStart', e.target.value)}
                  />
                </Field>
                {err('workStart')}
              </div>
              <div>
                <Field label="Jam pulang">
                  <input
                    type="time"
                    className={`${inputCls} font-mono tabular-nums`}
                    value={f.workEnd}
                    onChange={(e) => set('workEnd', e.target.value)}
                  />
                </Field>
                {err('workEnd')}
              </div>
              <div className="sm:col-span-2">
                <Field
                  label="Toleransi keterlambatan (menit)"
                  hint="Presensi setelah jam masuk + toleransi ditandai terlambat."
                >
                  <input
                    className={`${inputCls} font-mono tabular-nums`}
                    inputMode="numeric"
                    value={f.graceMin}
                    onChange={(e) =>
                      set('graceMin', e.target.value.replace(/\D/g, ''))
                    }
                  />
                </Field>
                {err('graceMin')}
              </div>
            </div>
          </Panel>

          {savedNotice && (
            <div
              role="status"
              className="border-2 border-foreground rounded-md bg-accent px-4 py-2.5 text-sm font-bold"
            >
              {savedNotice}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Btn type="submit" disabled={!dirty || !valid}>
              <Save size={18} /> Simpan perubahan
            </Btn>
            <Btn
              variant="ghost"
              onClick={() => setF(initial())}
              disabled={!dirty}
            >
              <RotateCcw size={18} /> Reset
            </Btn>
          </div>
        </form>

        <div className="space-y-6">
          <Panel title="Lisensi" kicker="Hanya baca">
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <KeyRound size={14} /> Kunci lisensi
                </dt>
                <dd className="font-mono font-bold">{tenant.licenseKey}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Aktif sampai</dt>
                <dd className="font-bold tabular-nums">
                  {fmtDate(tenant.activeUntil, 'd MMMM yyyy')}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Kuota pengguna</dt>
                <dd className="font-bold tabular-nums">
                  {tenant.maxUsers} pengguna
                </dd>
              </div>
            </dl>
            <p className="text-xs text-muted-foreground mt-4 border-t-2 border-dashed border-foreground/30 pt-3">
              Perpanjangan dan perubahan kuota dilakukan oleh penyedia platform.
            </p>
          </Panel>

          <Panel
            title="Aturan presensi aktif"
            kicker="3 lapis keamanan"
            tone="dark"
          >
            <ul className="space-y-4">
              {rules.map((r) => (
                <li key={r.t} className="flex gap-3">
                  <r.icon
                    size={20}
                    className="text-accent shrink-0 mt-0.5"
                    aria-hidden
                  />
                  <div>
                    <p className="font-display font-bold">{r.t}</p>
                    <p className="text-sm text-background/70">{r.d}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-background/60 flex items-center gap-2 border-t border-background/30 pt-3">
              <Globe2 size={14} /> Jadwal {tenant.workStart}–{tenant.workEnd},
              toleransi {tenant.graceMin} menit.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

export default AdminPengaturan;
