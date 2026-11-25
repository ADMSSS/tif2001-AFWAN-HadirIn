export const MAX_ACCURACY_M = 100;

export function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function offsetMeters(lat, lng, northM, eastM) {
  return {
    lat: lat + northM / 111320,
    lng: lng + eastM / (111320 * Math.cos((lat * Math.PI) / 180)),
  };
}

export function validateLocation(office, reading) {
  const distance = haversine(office.lat, office.lng, reading.lat, reading.lng);
  const checks = [
    {
      id: 'mock',
      label: 'Deteksi Fake GPS',
      ok: !reading.mocked,
      detail: reading.mocked
        ? 'Terindikasi lokasi palsu (akurasi tidak wajar / mock provider).'
        : 'Sinyal lokasi GPS perangkat terverifikasi asli.',
    },
    {
      id: 'akurasi',
      label: 'Akurasi GPS',
      ok: reading.accuracy > 0 && reading.accuracy <= MAX_ACCURACY_M,
      detail: `±${Math.round(reading.accuracy)} m (batas ${MAX_ACCURACY_M} m)`,
    },
    {
      id: 'radius',
      label: 'Geofence kantor',
      ok: distance <= office.radius,
      detail: `${Math.round(distance)} m dari titik kantor (batas ${office.radius} m)`,
    },
  ];
  return { checks, distance, ok: checks.every((c) => c.ok) };
}
