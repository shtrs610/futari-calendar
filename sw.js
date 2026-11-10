// ふたりカレンダー：オフラインでも画面だけは開けるようにする（予定などのデータは保存しない）
const V = "fc-1.1.0";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "apple-touch-icon.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return; // Google・サーバーへの通信はそのまま
  e.respondWith(fetch(e.request).then((r) => { if (r.ok && SHELL.some((s) => u.pathname.endsWith(s.replace("./", "")))) { const c = r.clone(); caches.open(V).then((ca) => ca.put(e.request, c)); } return r; })
    .catch(() => caches.match(e.request).then((r) => r || caches.match("./"))));
});
