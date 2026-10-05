import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { clearLegacyKeys } from './lib/session';
import './styles.css';

// Older builds stored half-sessions under separate keys (the cause of the Google login bug).
clearLegacyKeys();

// Places autocomplete for the course name is optional; skip it entirely without a key.
const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
if (mapsKey && !document.getElementById('google-maps-script')) {
  const script = document.createElement('script');
  script.id = 'google-maps-script';
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(mapsKey)}&libraries=places`;
  script.async = true;
  document.head.appendChild(script);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
