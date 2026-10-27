const V='reise-v5',F=['./','./index.html','./parse.js','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'],CDN=['cdn.jsdelivr.net','tessdata.projectnaptha.com'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(F)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith('reise-v')&&x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
 if(CDN.includes(u.host)){e.respondWith(caches.open('reise-libs').then(c=>c.match(r).then(h=>h||fetch(r).then(n=>{if(n.ok)c.put(r,n.clone());return n}))));return}
 if(u.origin!==location.origin)return;
 e.respondWith(fetch(r).then(n=>{const c=n.clone();caches.open(V).then(ch=>ch.put(r,c));return n}).catch(()=>caches.match(r,{ignoreSearch:true}).then(h=>h||caches.match('./index.html'))))});
