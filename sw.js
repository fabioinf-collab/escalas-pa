// Mantém o sistema funcionando sem internet depois do primeiro acesso.
const CACHE = "escalas-pa-v5";
const ARQUIVOS = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  // Página: tenta a versão mais nova e usa a guardada quando estiver sem internet.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put("./index.html", c)); return r; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }
  // Demais arquivos (ícones, fontes): usa o guardado e atualiza quando possível.
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok || r.type === "opaque") { const c = r.clone(); caches.open(CACHE).then(k => k.put(req, c)); }
      return r;
    }))
  );
});
