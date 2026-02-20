import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const isDevHost =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isDevHost) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .then(() => caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))))
        .catch((error) => {
          console.warn('Service worker cleanup failed:', error);
        });
      return;
    }

    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Service worker registration failed:', error);
    });
  });
}
