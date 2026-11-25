import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { captureException } from '../utils/sentry';

/**
 * SentryErrorBoundary - Menangkap runtime exception pada pohon komponen React
 * dan mengirimkannya ke Sentry sesuai Bagian 3.1 Handout Sprint 2.
 */
export class SentryErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Terjadi kesalahan tidak terduga pada antarmuka.',
    };
  }

  componentDidCatch(error, errorInfo) {
    captureException(error, {
      componentStack: errorInfo?.componentStack || '',
    });
  }

  handleReload = () => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground grid place-items-center p-6">
          <div className="max-w-md w-full border-2 border-foreground rounded-md bg-card p-6 shadow-[8px_8px_0_0_#d93a15] space-y-4">
            <div className="w-12 h-12 rounded-md bg-destructive text-destructive-foreground border-2 border-foreground grid place-items-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Sentry Error Boundary
              </p>
              <h1 className="font-display text-2xl font-extrabold mt-1">
                Gangguan pada Antarmuka
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Laporan galat telah dicatat otomatis oleh modul pemantauan Sentry.
              </p>
            </div>
            <pre className="font-mono text-xs bg-secondary border border-foreground/30 rounded p-3 overflow-x-auto">
              {this.state.errorMessage}
            </pre>
            <button
              type="button"
              onClick={this.handleReload}
              className="w-full inline-flex items-center justify-center gap-2 bg-foreground text-accent font-display font-bold px-5 py-3 rounded-md border-2 border-foreground shadow-[4px_4px_0_0_#c9f23c] cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Muat Ulang Aplikasi
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SentryErrorBoundary;
