import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import SentryErrorBoundary from './components/ErrorBoundary.jsx';
import { initSentry } from './utils/sentry.js';

initSentry();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SentryErrorBoundary>
      <App />
    </SentryErrorBoundary>
  </StrictMode>
);
