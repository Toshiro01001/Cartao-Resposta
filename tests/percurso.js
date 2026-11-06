// Percorre o site nos três tamanhos pedidos, sem erro no console e sem rolagem lateral.
//   node tests/percurso.js [--capturas <pasta>] [--raiz <pasta>] [--completo]
// --completo também abre todas as aulas, níveis, módulos e questões em 320 px.
const fs = require('fs'), path = require('path');
const { RAIZ, servir, contexto, vigiar, ir, chromium } = require('./comum');
const arg = process.argv, val = n => arg.includes(n) ? path.resolve(arg[arg.indexOf(n) + 1]) : null;
const capt = val('--capturas'), raiz = val('--raiz') || RAIZ, completo = arg.includes('--completo');
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1';
const TAM = {
  '1366x800': { viewport: { width: 1366, height: 800 }, deviceScaleFactor: 2 },
  'iphone13': { viewport: { width: 390, height: 664 }, screen: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: UA },
  '320px': { viewport: { width: 320, height: 640 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: UA }
};
if (capt) fs.mkdirSync(capt, { recursive: true });

(async () => {
  const srv = await servir(raiz), nav = await chromium.launch(), falhas = [];
  for (const [nome, op] of Object.entries(TAM)) {
    const c = await contexto(nav, { ...op, permissions: ['clipboard-read', 'clipboard-write'] }), pg = await c.newPage(), erros = [];
    vigiar(pg, erros);
    let n = 0;
    const checar = async (etapa, foto = true) => {
      await pg.waitForTimeout(40);
      const m = await pg.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
      if (m.s > m.c) falhas.push(`${nome} / ${etapa}: rolagem lateral (${m.s} > ${m.c})`);
      if (capt && foto) await pg.screenshot({ path: path.join(capt, `${nome}-${String(++n).padStart(2, '0')}-${etapa}.png`) });
    };
    await pg.goto(srv.base + '/'); await pg.waitForSelector('.cartao'); await checar('inicio');
    await pg.click('[data-a="perfil"][data-v="esposa"]'); await pg.waitForSelector('#trilha-sel'); await checar('perfil-alice');
    await pg.selectOption('#trilha-sel', 'cgu-aud'); await checar('trilha-cgu', false);
    await ir(pg, 'questoes');
    const ce = await pg.$eval('article.q', e => e.id.slice(2));
    await pg.click(`[data-a="marcar"][data-q="${ce}"][data-v="true"]`); await checar('questao-certo-errado');
    await pg.click(`[data-a="responder"][data-v="${ce}"]`); await checar('questao-ce-respondida', false);
    await pg.click('[data-a="perfil"][data-v="rodrigo"]'); await pg.waitForSelector('.cartao');

    await ir(pg, 'aulas'); await checar('aulas');
    const curta = await pg.evaluate(() => aulasTrilha('cam-ti').find(a => !a.modulos).id);
    await ir(pg, 'aula-' + curta); await checar('aula-curta');
    for (const v of ['simples', 'concurseiro', 'especialista', 'didatico']) { await pg.click(`[data-a="nivel"][data-v="${v}"]`); await checar('nivel-' + v, v === 'concurseiro'); }
    const longa = await pg.evaluate(() => aulasTrilha('cam-ti').find(a => a.modulos).id);
    await ir(pg, 'aula-' + longa); await checar('aula-modulos');
    await pg.click('[data-a="mod-ok"]'); await checar('aula-modulo-2', false);

    await ir(pg, 'questoes');
    const q = await pg.$eval('article.q', e => e.id.slice(2)), g = await pg.evaluate(i => QUEST[i].ans, q);
    await pg.click(`[data-a="riscar"][data-q="${q}"][data-v="${(g + 1) % 4}"]`);
    await pg.click(`[data-a="marcar"][data-q="${q}"][data-v="${g}"]`); await pg.evaluate(() => scrollTo(0, 0)); await checar('questao-marcada');
    await pg.click(`[data-a="responder"][data-v="${q}"]`); await checar('questao-respondida');
    await pg.selectOption('#f-st', 'fav'); await checar('questoes-filtro', false);
    await pg.selectOption('#f-st', '');

    await ir(pg, 'simulados'); await checar('simulados');
    await pg.click('[data-a="sim-novo"][data-v="rapido"]'); await pg.waitForSelector('#relogio'); await checar('simulado-ativo');
    await pg.click('[data-a="sim-marca"]'); await pg.click('[data-a="sim-risca"]:last-of-type'); await checar('simulado-marcado');
    await pg.click('.bt[data-a="sim-ir"]:not([disabled]):last-child'); await checar('simulado-proxima', false);
    await pg.click('[data-a="sim-marca"]');
    await pg.click('[data-a="sim-fim"]'); await checar('simulado-entregar');
    await pg.click('#m-sim'); await pg.waitForSelector('.placar'); await checar('simulado-resultado');

    const d = await pg.evaluate(() => DB.discursivas.find(x => x.trilha === 'cam-ti').id);
    await ir(pg, 'discursivas'); await checar('discursivas', false);
    await ir(pg, 'disc-' + d); await pg.fill('#redacao', 'Texto de teste.'); await pg.click('[data-a="d-ver"]'); await checar('discursiva', false);
    await ir(pg, 'fontes'); await checar('fontes', false);
    await ir(pg, 'mais'); await checar('mais', false);

    await ir(pg, 'desempenho'); await checar('desempenho');
    await pg.click('[data-a="exp-copia"]'); await pg.waitForSelector('.toast');
    const cod = await pg.evaluate(() => navigator.clipboard.readText());
    await pg.fill('#imp-tx', cod); await pg.click('[data-a="imp-cola"]'); await pg.waitForSelector('.toast');
    await pg.locator('[data-a="exp-copia"]').scrollIntoViewIfNeeded(); await checar('codigo-progresso');
    if (!JSON.parse(cod).perfis) falhas.push(`${nome}: código de progresso inválido`);

    await pg.reload(); await pg.waitForSelector('main'); await ir(pg, 'inicio');
    if (await pg.$$eval('.bolhas .b.ok, .bolhas .b.no', e => e.length) < 1) falhas.push(`${nome}: progresso sumiu ao recarregar`);
    await pg.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark')); await checar('tema-escuro');

    if (completo && nome === '320px') {
      const r = await pg.evaluate(async () => {
        const larg = () => document.documentElement.scrollWidth > document.documentElement.clientWidth, ruins = [], p = P(); let vistos = 0;
        for (const a of DB.aulas) for (const nv of Object.keys(NIVEIS)) for (let i = 0; i <= (a.modulos ? a.modulos.length : 0); i++) {
          p.nivel = nv; if (a.modulos) { p.modI = p.modI || {}; p.modI[a.id] = i; }
          location.hash = 'aula-' + a.id; render(); vistos++; if (larg()) ruins.push(`aula ${a.id} ${nv} ${i}`);
        }
        location.hash = 'questoes'; render();
        for (let k = 0; k < DB.questoes.length; k += 40) { $('#main').innerHTML = DB.questoes.slice(k, k + 40).map(q => cardQ(q)).join(''); if (larg()) ruins.push('questões a partir de ' + k); }
        return { vistos, ruins };
      });
      console.log(`${nome}: ${r.vistos} telas de aula e ${await pg.evaluate(() => DB.questoes.length)} questões abertas em 320 px, ${r.ruins.length} com rolagem lateral`);
      r.ruins.forEach(x => falhas.push('320px: rolagem lateral em ' + x));
    }
    erros.forEach(e => falhas.push(`${nome}: ${e}`));
    await c.close();
    console.log(`${nome}: percurso concluído, ${erros.length} erros no console`);
  }
  await nav.close(); srv.fechar();
  falhas.forEach(f => console.log('FALHA', f));
  console.log(falhas.length ? `${falhas.length} falhas` : 'Percurso sem falhas');
  process.exit(falhas.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
