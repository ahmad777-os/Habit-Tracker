/**
 * Ritual — Habit Tracker
 * PWA bootstrap: registers the service worker, wires up the "Install App"
 * button via beforeinstallprompt, and surfaces an "update available" toast
 * when a new version has been deployed.
 *
 * This file does not touch any existing app logic — it only adds PWA behavior.
 */

(() => {
  // ---------- Service Worker registration ----------
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .then((registration) => {
          // Listen for a new SW taking over control (i.e. an update finished
          // installing and activated). Reload once so the page picks up the
          // latest cached assets. guard against the very first install, which
          // also fires 'controllerchange' the first time a SW takes control.
          let refreshing = false;
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            refreshing = true;
            window.location.reload();
          });

          // Optional: surface a lightweight "update available" toast while a
          // new worker is installing, in case we want the user to know.
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdateToast(newWorker);
              }
            });
          });
        })
        .catch((err) => {
          console.warn('Service worker registration failed:', err);
        });
    });
  }

  // ---------- "Update available" toast ----------
  function showUpdateToast(newWorker) {
    let toast = document.getElementById('pwaUpdateToast');
    if (toast) return; // already showing

    toast = document.createElement('div');
    toast.id = 'pwaUpdateToast';
    toast.className = 'pwa-update-toast';
    toast.innerHTML = `
      <span>A new version is available.</span>
      <button type="button">Refresh</button>
    `;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('visible'));

    toast.querySelector('button').addEventListener('click', () => {
      newWorker.postMessage('SKIP_WAITING');
    });
  }

  // ---------- Install App button ----------
  const installBtn = document.getElementById('installBtn');
  let deferredPrompt = null;

  // Chrome/Edge (desktop + Android) fire this when the app is installable.
  window.addEventListener('beforeinstallprompt', (event) => {
    // Prevent the default mini-infobar from showing on mobile.
    event.preventDefault();
    deferredPrompt = event;

    if (installBtn) {
      installBtn.classList.remove('hidden');
    }
  });

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;

      installBtn.disabled = true;
      deferredPrompt.prompt();

      try {
        await deferredPrompt.userChoice;
      } finally {
        deferredPrompt = null;
        installBtn.disabled = false;
        installBtn.classList.add('hidden');
      }
    });
  }

  // Hide the button (in case it's still visible) once the app is installed —
  // covers install flows triggered outside our button (e.g. browser menu).
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    if (installBtn) installBtn.classList.add('hidden');
  });

  // If the app is already running standalone (installed), never show the button.
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true; // iOS Safari

  if (isStandalone && installBtn) {
    installBtn.classList.add('hidden');
  }
})();
