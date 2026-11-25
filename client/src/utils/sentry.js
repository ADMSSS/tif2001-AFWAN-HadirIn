/**
 * Modul Real-Time Error Tracking (Sentry Client Integration)
 * Sesuai Bagian 3.1 Handout Sprint 2 (Pertemuan 10–13)
 */
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';

export function initSentry() {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    captureException(event.error || new Error(event.message), {
      source: 'window.onerror',
      filename: event.filename,
      lineno: event.lineno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    captureException(
      event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason)),
      { source: 'unhandledrejection' }
    );
  });
}

export function captureException(error, context = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    message: error?.message || String(error),
    stack: error?.stack || '',
    dsnConfigured: Boolean(SENTRY_DSN),
    context,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  };

  try {
    const existing = JSON.parse(
      localStorage.getItem('hadirin_sentry_events') || '[]'
    );
    existing.unshift(payload);
    localStorage.setItem(
      'hadirin_sentry_events',
      JSON.stringify(existing.slice(0, 25))
    );
  } catch {
    // Abaikan jika storage penuh
  }

  if (SENTRY_DSN && SENTRY_DSN.startsWith('https://')) {
    try {
      const url = new URL(SENTRY_DSN);
      const publicKey = url.username;
      const projectId = url.pathname.replace(/\//g, '');
      if (publicKey && projectId) {
        const endpoint = `${url.protocol}//${url.host}/api/${projectId}/store/?sentry_key=${publicKey}&sentry_version=7`;
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: payload.message,
            level: 'error',
            platform: 'javascript',
            extra: payload,
          }),
        }).catch(() => undefined);
      }
    } catch {
      // Abaikan jika format DSN belum valid
    }
  }
}
