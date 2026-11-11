// Service worker minimale per ADOcar: abilita installazione e uso offline della "shell" dell'app.
// Le chiamate a Google (Drive, Fogli, login) NON vengono toccate: passano sempre dalla rete.
const CACHE = 'adocar-v2';
const SCOPE = self.registration.scope; // es. https://abbado71.github.io/ADOcar/

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll([SCOPE, SCOPE + 'manifest.json'])).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(SCOPE)) return; // solo file dell'app

  // Pagine: prima la rete (così ricevi gli aggiornamenti), cache se offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(SCOPE, copy));
          return res;
        })
        .catch(() => caches.match(SCOPE))
    );
    return;
  }

  // File statici (JS/CSS/immagini con hash): cache, poi rete
  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      });
    })
  );
});
