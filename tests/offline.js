// Sem internet e sem prender versão antiga, com o site num subcaminho como no GitHub Pages.
//   node tests/offline.js
const { CHAVE, servir, contexto, vigiar, ir, lerProgresso, chromium } = require('./comum');
const fs = require('fs'), path = require('path');
const falhas = []; let oks = 0;
const conferir = (c, m) => { c ? oks++ : falhas.push(m); console.log((c ? 'ok    ' : 'FALHA ') + m); };
const TAM = { '1366x800': { viewport: { width: 1366, height: 800 } }, iPhone: { viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true } };

(async () => {
  const nav = await chromium.launch();
  const original = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  for (const [nome, op] of Object.entries(TAM)) {
    const trocar = {}, srv = await servir(undefined, trocar, '/Cartao-Resposta'), erros = [];
    const c = await contexto(nav, { ...op, serviceWorkers: 'allow' }), pg = await c.newPage(); vigiar(pg, erros);
    await pg.goto(srv.base + '/'); await pg.waitForSelector('.cartao');
    await pg.evaluate(async () => {
      await caches.open('outro-site'); localStorage.setItem('outro-site.dados', 'x');
      const reg = await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) await new Promise(r => navigator.serviceWorker.addEventListener('controllerchange', r, { once: true }));
      for (let i = 0; i < 100 && !(await (await caches.open('cartao-resposta-pagina')).match(reg.scope)); i++) await new Promise(r => setTimeout(r, 50));
    });
    conferir(await pg.evaluate(async () => (await navigator.serviceWorker.ready).scope.endsWith('/Cartao-Resposta/')), `${nome}: o service worker só cobre a pasta do site`);
    await ir(pg, 'questoes');
    const q = await pg.$eval('article.q', e => e.id.slice(2));
    await pg.click(`[data-a="marcar"][data-q="${q}"][data-v="0"]`); await pg.click(`[data-a="responder"][data-v="${q}"]`);
    const antes = (await lerProgresso(pg)).v1;

    // Sem internet.
    await c.setOffline(true);
    await pg.goto(srv.base + '/#inicio'); await pg.reload(); await pg.waitForSelector('.cartao');
    conferir((await lerProgresso(pg)).v1 === antes, `${nome}: sem internet, o site abre com o progresso intacto`);
    await ir(pg, 'aulas'); await pg.waitForSelector('.aula-l');
    const a = await pg.evaluate(() => aulasTrilha('cam-ti').find(a => !a.modulos).id);
    await ir(pg, 'aula-' + a); await pg.waitForSelector('#corpo-aula');
    await ir(pg, 'questoes');
    const q2 = await pg.$$eval('article.q', e => e.map(x => x.id.slice(2))).then(l => l.find(i => i !== q));
    await pg.click(`[data-a="marcar"][data-q="${q2}"][data-v="0"]`); await pg.click(`[data-a="responder"][data-v="${q2}"]`);
    conferir(JSON.parse((await lerProgresso(pg)).v1).perfis.rodrigo.resp[q2], `${nome}: sem internet, responder questão salva`);
    await ir(pg, 'simulados'); await pg.click('[data-a="sim-novo"][data-v="rapido"]'); await pg.waitForSelector('#relogio');
    conferir(true, `${nome}: sem internet, o simulado começa`);
    const offline = (await lerProgresso(pg)).v1;

    // Versão nova publicada: precisa aparecer na primeira visita com internet, apesar do cache de 10 min do servidor.
    await c.setOffline(false);
    trocar['/index.html'] = original.replace('<head>', '<head><meta name="versao-teste" content="2">');
    await pg.goto(srv.base + '/#inicio'); await pg.reload(); await pg.waitForSelector('.cartao');
    conferir(!!(await pg.$('meta[name="versao-teste"]')), `${nome}: versão nova aparece na primeira visita online`);
    conferir((await lerProgresso(pg)).v1 === offline, `${nome}: progresso feito sem internet continua depois da atualização`);
    await pg.waitForTimeout(300);

    // A cópia guardada é atualizada.
    await c.setOffline(true);
    await pg.reload(); await pg.waitForSelector('.cartao');
    conferir(!!(await pg.$('meta[name="versao-teste"]')), `${nome}: a cópia para uso sem internet também foi atualizada`);
    await c.setOffline(false);

    // Servidor com erro 500 usa a cópia; 404 aparece como 404, então nada fica preso se o site sair do ar.
    trocar.__status = 500; await pg.reload(); await pg.waitForSelector('.cartao');
    conferir(true, `${nome}: erro 500 do servidor abre a cópia guardada`);
    trocar.__status = 404; const r404 = await pg.reload();
    conferir(r404.status() === 404, `${nome}: site retirado do ar responde 404, sem ficar preso na cópia`);
    delete trocar.__status;

    // Vizinhos no mesmo domínio.
    await pg.reload(); await pg.waitForSelector('.cartao');
    conferir(await pg.evaluate(async () => (await caches.has('outro-site')) && localStorage.getItem('outro-site.dados') === 'x'), `${nome}: caches e dados de outros sites do domínio ficam intactos`);
    const pg2 = await c.newPage(); const r2 = await pg2.goto(srv.raiz + '/outro-projeto/');
    conferir(r2.status() === 404, `${nome}: outra pasta do domínio não passa pelo service worker`);
    await pg2.close();

    const ruins = erros.filter(e => !/404|500|ERR_INTERNET_DISCONNECTED/.test(e));
    conferir(ruins.length === 0, `${nome}: sem erros de código no console ` + ruins.join(' | '));
    await c.close(); srv.fechar();
  }
  await nav.close();
  console.log(`\n${oks} ok, ${falhas.length} falhas`);
  process.exit(falhas.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
