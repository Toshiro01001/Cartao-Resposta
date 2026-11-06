// Cada correção da auditoria tem aqui uma verificação, para não voltar a quebrar.
//   node tests/correcoes.js
const fs = require('fs'), path = require('path'), os = require('os');
const { CHAVE, servir, contexto, vigiar, ir, lerProgresso, chromium } = require('./comum');
const ref = JSON.parse(fs.readFileSync(path.join(__dirname, 'referencia', 'progresso-gerado.json'), 'utf8')).v1;
const falhas = []; let oks = 0;
const conferir = (c, m) => { c ? oks++ : falhas.push(m); console.log((c ? 'ok    ' : 'FALHA ') + m); };

(async () => {
  const srv = await servir(), nav = await chromium.launch(), erros = [];
  const abrir = async (op = {}, comProgresso = false) => {
    const c = await contexto(nav, op), pg = await c.newPage(); vigiar(pg, erros);
    if (comProgresso) await c.addInitScript(([k, v]) => { if (!localStorage.getItem(k)) localStorage.setItem(k, v); }, [CHAVE, ref]);
    await pg.goto(srv.base + '/#inicio'); await pg.waitForSelector('.cartao');
    return pg;
  };
  const focoEm = (pg, s) => pg.evaluate(s => { const a = document.activeElement; return !!a && a.matches(s); }, s);

  // Alternativa marcada: o leitor de tela precisa saber qual é.
  {
    const pg = await abrir();
    await ir(pg, 'questoes');
    const q = await pg.$eval('article.q', e => e.id.slice(2)), g = await pg.evaluate(i => QUEST[i].ans, q);
    const alt = v => `[data-a="marcar"][data-q="${q}"][data-v="${v}"]`, tes = v => `[data-a="riscar"][data-q="${q}"][data-v="${v}"]`;
    conferir(await pg.getAttribute(alt(g), 'aria-pressed') === 'false', 'alternativa começa sem marcação anunciada');
    await pg.click(alt(g));
    conferir(await pg.getAttribute(alt(g), 'aria-pressed') === 'true', 'alternativa marcada anuncia aria-pressed=true');
    conferir(await pg.getAttribute(alt((g + 1) % 4), 'aria-pressed') === 'false', 'as outras alternativas anunciam aria-pressed=false');
    await pg.click(tes((g + 1) % 4));
    conferir(await pg.getAttribute(tes((g + 1) % 4), 'aria-pressed') === 'true', 'alternativa riscada anuncia o estado');
    await pg.click(`[data-a="responder"][data-v="${q}"]`);
    conferir((await pg.textContent(alt(g))).includes('sua resposta'), 'depois de responder, a sua resposta é dita em texto');
    conferir((await pg.textContent(alt(g))).includes('gabarito'), 'depois de responder, o gabarito é dito em texto');
    await pg.click('[data-a="perfil"][data-v="esposa"]'); await pg.waitForSelector('#trilha-sel');
    await pg.selectOption('#trilha-sel', 'cgu-aud'); await ir(pg, 'questoes');
    const ce = await pg.$eval('article.q', e => e.id.slice(2));
    await pg.click(`[data-a="marcar"][data-q="${ce}"][data-v="true"]`);
    conferir(await pg.getAttribute(`[data-a="marcar"][data-q="${ce}"][data-v="true"]`, 'aria-pressed') === 'true', 'Certo ou Errado anuncia a marcação');
    await ir(pg, 'simulados'); await pg.click('[data-a="sim-novo"]'); await pg.waitForSelector('#relogio');
    await pg.click('[data-a="sim-marca"][data-v="true"]');
    conferir(await pg.getAttribute('[data-a="sim-marca"][data-v="true"]', 'aria-pressed') === 'true', 'simulado de Certo ou Errado anuncia a marcação');
    await pg.click('[data-a="perfil"][data-v="rodrigo"]'); await pg.waitForSelector('.cartao');
    await ir(pg, 'simulados'); await pg.click('[data-a="sim-novo"][data-v="rapido"]'); await pg.waitForSelector('#relogio');
    await pg.click('[data-a="sim-marca"][data-v="1"]');
    conferir(await pg.getAttribute('[data-a="sim-marca"][data-v="1"]', 'aria-pressed') === 'true', 'simulado de múltipla escolha anuncia a marcação');
    conferir(await pg.getAttribute('[data-a="sim-marca"][data-v="0"]', 'aria-pressed') === 'false', 'simulado anuncia as não marcadas');
    await pg.click('[data-a="sim-risca"][data-v="2"]');
    conferir(await pg.getAttribute('[data-a="sim-risca"][data-v="2"]', 'aria-pressed') === 'true', 'simulado anuncia a alternativa riscada');
    await pg.context().close();
  }

  // Estados que eram só cor.
  {
    const pg = await abrir({}, true), r = JSON.parse(ref).perfis.rodrigo;
    await ir(pg, 'aulas');
    conferir((await pg.$$eval('.aula-l .sr', e => e.map(x => x.textContent))).filter(x => x.includes('Estudada')).length === Object.keys(r.vistas).length, 'lista de aulas diz em texto quais foram estudadas');
    await ir(pg, 'aula-' + Object.keys(r.modOk)[0]);
    conferir(await pg.$$eval('.mod-i .sr', e => e.length) === Object.keys(r.modOk[Object.keys(r.modOk)[0]]).length, 'módulos concluídos são ditos em texto');
    await ir(pg, 'simulado-ativo');
    conferir(!!(await pg.$('.grade-c [aria-current="true"]')), 'a questão atual do simulado tem aria-current');
    conferir(await pg.getAttribute('#relogio', 'role') === 'timer', 'o relógio tem role=timer');
    await pg.context().close();
  }

  // Foco do teclado.
  {
    const pg = await abrir();
    await pg.keyboard.press('Tab');
    conferir(await focoEm(pg, '.pular'), 'primeiro Tab chega ao link de pular');
    const top = await pg.$eval('.pular', e => e.getBoundingClientRect().top);
    conferir(top >= 0, 'o link de pular fica visível ao receber foco');
    await pg.keyboard.press('Enter');
    conferir(await focoEm(pg, '#main'), 'pular leva o foco ao conteúdo');
    await ir(pg, 'aulas');
    conferir(await focoEm(pg, '#main'), 'trocar de página leva o foco ao conteúdo');
    await ir(pg, 'questoes');
    const q = await pg.$eval('article.q', e => e.id.slice(2)), alt = `[data-a="marcar"][data-q="${q}"][data-v="0"]`;
    await pg.focus(alt); await pg.keyboard.press('Enter');
    conferir(await focoEm(pg, alt) && await pg.getAttribute(alt, 'aria-pressed') === 'true', 'marcar com Enter mantém o foco na alternativa');
    await pg.focus(`[data-a="fav"][data-v="${q}"]`); await pg.keyboard.press('Enter');
    conferir(await focoEm(pg, `[data-a="fav"][data-v="${q}"]`), 'favoritar mantém o foco');
    await pg.focus(`[data-a="responder"][data-v="${q}"]`); await pg.keyboard.press('Enter');
    conferir(await focoEm(pg, `#q-${q} .veredito`), 'responder leva o foco ao veredito');
    await pg.focus('#f-st'); await pg.selectOption('#f-st', 'nao');
    conferir(await focoEm(pg, '#f-st'), 'filtro usado pelo teclado mantém o foco');
    const curta = await pg.evaluate(() => aulasTrilha('cam-ti').find(a => !a.modulos).id);
    await ir(pg, 'aula-' + curta);
    const nv = '[data-a="nivel"][data-v="simples"]';
    await pg.focus(nv); await pg.keyboard.press('Enter');
    conferir(await focoEm(pg, nv), 'trocar o nível mantém o foco');
    await ir(pg, 'simulados'); await pg.click('[data-a="sim-novo"][data-v="rapido"]'); await pg.waitForSelector('#relogio');
    await pg.focus('[data-a="sim-marca"][data-v="1"]'); await pg.keyboard.press('Enter');
    conferir(await focoEm(pg, '[data-a="sim-marca"][data-v="1"]'), 'marcar no simulado mantém o foco');
    await pg.focus('.bt[data-a="sim-ir"]:last-child'); await pg.keyboard.press('Enter');
    conferir(await focoEm(pg, '.sim-layout .q'), 'Próxima leva o foco à questão nova');
    await pg.focus('.grade-c [data-v="3"]'); await pg.keyboard.press('Enter');
    conferir(await focoEm(pg, '.grade-c [data-v="3"]'), 'a grade do simulado mantém o foco');
    await pg.context().close();
    // Toque no celular: um campo nunca recebe foco sozinho depois de redesenhar.
    const cel = await abrir({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true });
    await ir(cel, 'questoes');
    await cel.tap('#f-st'); await cel.selectOption('#f-st', 'nao');
    conferir(!(await focoEm(cel, 'select,input,textarea')), 'no toque, redesenhar não devolve o foco a campos');
    await cel.context().close();
  }

  // Janela de confirmação.
  {
    const pg = await abrir();
    await ir(pg, 'simulados'); await pg.click('[data-a="sim-novo"][data-v="rapido"]'); await pg.waitForSelector('#relogio');
    await pg.focus('[data-a="sim-fim"]'); await pg.keyboard.press('Enter');
    conferir(await focoEm(pg, '#m-sim'), 'a janela abre com foco no botão principal');
    await pg.keyboard.press('Tab'); conferir(await focoEm(pg, '#m-nao'), 'Tab vai para o outro botão da janela');
    await pg.keyboard.press('Tab'); conferir(await focoEm(pg, '#m-sim'), 'Tab não sai da janela');
    await pg.keyboard.press('Escape');
    conferir(!(await pg.$('.modal')) && await focoEm(pg, '[data-a="sim-fim"]'), 'Esc fecha a janela e devolve o foco a quem abriu');
    conferir(!!(await pg.evaluate(() => P().sim)), 'Esc não entrega a prova');
    await pg.keyboard.press('Enter'); await pg.keyboard.press('Enter');
    await pg.waitForSelector('.placar');
    conferir(await focoEm(pg, '#main'), 'entregar leva o foco ao resultado');
    await pg.context().close();
  }

  // FIM
  conferir(erros.length === 0, 'nenhum erro no console: ' + (erros.join(' | ') || 'zero'));
  await nav.close(); srv.fechar();
  console.log(`\n${oks} ok, ${falhas.length} falhas`);
  process.exit(falhas.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
