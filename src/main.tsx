import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker with auto-refresh on updates
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New PWA content available');
  },
  onOfflineReady() {
    console.log('PWA is ready to work offline');
  }
});

createRoot(document.getElementById('root')!).render(<App />);
