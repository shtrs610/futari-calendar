// ふたりカレンダー：オフラインでも画面だけは開けるようにする＋通知（予定などのデータは保存しない）
const V = "fc-1.2.0";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "apple-touch-icon.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return; // Google・サーバーへの通信はそのまま
  e.respondWith(fetch(e.request).then((r) => { if (r.ok && SHELL.some((s) => u.pathname.endsWith(s.replace("./", "")))) { const c = r.clone(); caches.open(V).then((ca) => ca.put(e.request, c)); } return r; })
    .catch(() => caches.match(e.request).then((r) => r || caches.match("./"))));
});
// 通知が届いたとき
self.addEventListener("push", (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  const jobs = [self.registration.showNotification(d.title || "ふたりカレンダー", { body: d.body || "", icon: "icon-192.png", badge: "icon-192.png", tag: d.tag || undefined, data: { d: d.d, k: d.k } })];
  if (self.navigator && self.navigator.setAppBadge && typeof d.badge === "number") jobs.push((d.badge > 0 ? self.navigator.setAppBadge(d.badge) : self.navigator.clearAppBadge()).catch(() => {}));
  e.waitUntil(Promise.all(jobs));
});
// 通知を押したとき：アプリを開いて、その予定を表示する
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const o = e.notification.data || {};
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => {
    const c = cs.find((x) => x.url.includes("/futari-calendar/"));
    if (c) { c.postMessage({ open: o }); return c.focus(); }
    return self.clients.openWindow("./" + (o.d ? `?d=${encodeURIComponent(o.d)}&k=${encodeURIComponent(o.k || "")}` : ""));
  }));
});
