// Service worker de Comandas · Berry Sweet
// Sube el número de versión si cambias la lista SHELL.
const V = 'comandas-v1';
const SHELL = ['./comandas.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    // Archivos de la app: primero red (siempre la última versión), si no hay internet usa la copia guardada
    e.respondWith(
      fetch(r).then(res => {
        if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); }
        return res;
      }).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || (r.mode === 'navigate' ? caches.match('./comandas.html') : Response.error())))
    );
  } else if (u.hostname === 'www.gstatic.com' && u.pathname.includes('/firebasejs/')) {
    // Librerías de Firebase (con versión fija): primero la copia guardada
    e.respondWith(
      caches.match(r).then(m => m || fetch(r).then(res => {
        if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); }
        return res;
      }))
    );
  }
  // Todo lo demás (Firestore, imágenes) pasa directo a la red
});
