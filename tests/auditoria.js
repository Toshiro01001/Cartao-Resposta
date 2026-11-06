// Auditoria: axe-core (contraste, ARIA, rótulos) e tempo de carregamento.
// O axe não faz parte do site. Indique onde ele está: AXE=/caminho/axe.min.js node tests/auditoria.js [--raiz <pasta>]
const fs = require('fs'), path = require('path');
const { RAIZ, servir, contexto, ir, chromium, bloquearFontes } = require('./comum');
const arg = process.argv, raiz = arg.includes('--raiz') ? path.resolve(arg[arg.indexOf('--raiz') + 1]) : RAIZ;
const ref = JSON.parse(fs.readFileSync(path.join(__dirname, 'referencia', 'progresso-gerado.json'), 'utf8')).v1;

(async () => {
  const srv = await servir(raiz), nav = await chromium.launch();
  if (process.env.AXE) {
    const axe = fs.readFileSync(process.env.AXE, 'utf8'), tot = {};
    for (const [tam, op] of [['1366', { viewport: { width: 1366, height: 800 } }], ['320', { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true }]])
      for (const tema of ['light', 'dark']) {
        const c = await contexto(nav, op), pg = await c.newPage();
        await c.addInitScript(([v, t]) => { localStorage.setItem('cartao-resposta.v1', v); localStorage.setItem('cartao-resposta.v1.tema', t); }, [ref, tema]);
        await pg.goto(srv.base + '/#inicio'); await pg.waitForSelector('.cartao');
        const S = JSON.parse(ref), r = S.perfis.rodrigo;
        const curta = await pg.evaluate(() => aulasTrilha('cam-ti').find(a => !a.modulos).id), longa = Object.keys(r.modOk)[0];
        for (const rota of ['inicio', 'aulas', 'aula-' + curta, 'aula-' + longa, 'questoes', 'simulados', 'simulado-ativo', 'simulado-' + r.sims[0].t, 'discursivas', 'disc-' + Object.keys(r.disc)[0], 'desempenho', 'fontes', 'mais']) {
          await ir(pg, rota); await pg.waitForTimeout(30);
          await pg.evaluate(axe);
          const res = await pg.evaluate(() => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }));
          for (const v of res.violations) {
            const t = tot[v.id] = tot[v.id] || { impacto: v.impact, n: 0, ex: new Set(), det: new Set() };
            t.n += v.nodes.length; v.nodes.slice(0, 2).forEach(x => { t.ex.add(`${tam}/${tema}/${rota.split('-')[0]}: ${x.target[0]}`); const d = x.any[0] && x.any[0].data; if (d && d.contrastRatio) t.det.add(`${d.contrastRatio} ${d.fgColor}/${d.bgColor}`); });
          }
        }
        await c.close();
      }
    console.log('AXE:', Object.keys(tot).length, 'regras com violações');
    for (const [k, t] of Object.entries(tot)) console.log(`- ${k} [${t.impacto}] ${t.n} nós | ${[...t.ex].slice(0, 4).join(' ; ')} ${t.det.size ? '| ' + [...t.det].slice(0, 6).join(', ') : ''}`);
  }
  // Tempo: internet lenta simulada (1,6 Mbps, 150 ms) e processador 4x mais lento.
  for (const [nome, atraso] of [['fonte normal', 0], ['Google Fonts demorando 4 s', 4000]]) {
    const c = await nav.newContext({ viewport: { width: 390, height: 664 }, serviceWorkers: 'block' }), pg = await c.newPage();
    await c.route(/fonts\.(googleapis|gstatic)\.com/, async r => { if (atraso) await new Promise(o => setTimeout(o, atraso)); r.fulfill({ status: 200, contentType: 'text/css', body: '' }); });
    const cdp = await c.newCDPSession(pg);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await pg.goto(srv.base + '/', { waitUntil: 'commit' });
    await pg.waitForSelector('.cartao');
    await pg.waitForFunction(() => performance.getEntriesByName('first-contentful-paint').length > 0);
    const m = await pg.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return { bytes: n.transferSize, dcl: Math.round(n.domContentLoadedEventEnd), fcp: Math.round(performance.getEntriesByName('first-contentful-paint')[0].startTime) }; });
    console.log(`Carga (${nome}): ${Math.round(m.bytes / 1024)} KB transferidos, primeira pintura ${m.fcp} ms, página pronta ${m.dcl} ms`);
    await c.close();
  }
  await nav.close(); srv.fechar();
})().catch(e => { console.error(e); process.exit(2); });
