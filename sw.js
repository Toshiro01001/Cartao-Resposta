/* Service worker do Cartão-Resposta: permite abrir o site sem internet sem prender versões antigas.
   Com internet, a página sempre vem da rede. A cópia guardada só é usada quando a rede falha ou demora demais.
   Não toca no localStorage, e cada site deste domínio tem caches próprios, por isso nenhum outro cache é apagado. */
const CACHE = 'cartao-resposta-pagina';
const PAGINA = new URL('./', self.location).href;
const ESPERA_MS = 6000;
const ehPagina = u => u.href.split(/[?#]/)[0] === PAGINA || u.href.split(/[?#]/)[0] === PAGINA + 'index.html';

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    fetch(PAGINA, { cache: 'no-cache' })
      .then(r => (r.ok && !r.redirected ? caches.open(CACHE).then(c => c.put(PAGINA, r)) : null))
      .catch(() => {}) // sem rede na instalação: guarda na próxima visita
  );
});

self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.mode !== 'navigate' || !ehPagina(new URL(req.url))) return;
  e.respondWith(primeiroRede(e));
});

async function primeiroRede(e) {
  const cache = await caches.open(CACHE);
  const guardada = await cache.match(PAGINA);
  const rede = fetch(PAGINA, { cache: 'no-cache' }).then(res => {
    if (res.ok && !res.redirected) {
      e.waitUntil(cache.put(PAGINA, res.clone()).catch(() => {}));
      return res;
    }
    if (res.status >= 500 && guardada) return guardada;
    return res.redirected ? fetch(e.request) : res;
  });
  if (!guardada) return rede;
  const espera = new Promise(ok => setTimeout(() => ok(guardada), ESPERA_MS));
  return Promise.race([rede, espera]).catch(() => guardada);
}
