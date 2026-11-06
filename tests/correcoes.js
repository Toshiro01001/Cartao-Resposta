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

  // Abrir arquivo de progresso pelo teclado.
  {
    const pg = await abrir();
    await ir(pg, 'desempenho');
    await pg.focus('[data-a="exp-arq"]'); await pg.keyboard.press('Tab');
    conferir(await focoEm(pg, '#imp-arq'), 'Tab alcança o botão Abrir arquivo');
    const contorno = await pg.$eval('label.bt', e => getComputedStyle(e).outlineStyle);
    conferir(contorno === 'solid', 'Abrir arquivo mostra contorno de foco');
    const arq = path.join(os.tmpdir(), `progresso-teste-${process.pid}.json`); fs.writeFileSync(arq, ref);
    await pg.setInputFiles('#imp-arq', arq); await pg.waitForSelector('.toast');
    conferir(JSON.stringify(JSON.parse((await lerProgresso(pg)).v1).perfis.rodrigo.resp) === JSON.stringify(JSON.parse(ref).perfis.rodrigo.resp), 'abrir arquivo junta o progresso');
    fs.unlinkSync(arq);
    await pg.context().close();
  }

  // Contorno de foco visível, inclusive onde a caixa cortava, e tabelas roláveis pelo teclado.
  {
    const pg = await abrir({ viewport: { width: 320, height: 640 } }, true), r = JSON.parse(ref).perfis.rodrigo;
    await ir(pg, 'desempenho');
    conferir(await pg.$eval('.tab-rola', e => e.scrollWidth <= e.clientWidth || e.tabIndex === 0), 'tabela que rola recebe foco pelo teclado');
    const curta = await pg.evaluate(() => aulasTrilha('cam-ti').find(a => !a.modulos).id);
    await ir(pg, 'aula-' + curta);
    await pg.focus('[data-a="nivel"][data-v="simples"]'); await pg.keyboard.press('Shift+Tab'); await pg.keyboard.press('Tab');
    const ni = await pg.$eval('[data-a="nivel"][data-v="simples"]', e => { const s = getComputedStyle(e); return [s.outlineStyle, s.outlineOffset]; });
    conferir(ni[0] === 'solid' && ni[1] === '-3px', 'o contorno dos níveis fica para dentro, sem ser cortado');
    await ir(pg, 'simulado-ativo');
    const alt = await pg.$eval('.grade-c button', e => e.getBoundingClientRect().height);
    conferir(alt >= 24, `botões da grade do simulado têm 24 px ou mais (${alt})`);
    await pg.context().close();
    // Todo elemento alcançável pelo Tab mostra contorno de foco, em todas as telas.
    const pc = await abrir({}, true); let sem = [], total = 0;
    for (const rota of ['inicio', 'aulas', 'aula-' + curta, 'aula-' + Object.keys(r.modOk)[0], 'questoes', 'simulados', 'simulado-ativo', 'simulado-' + r.sims[0].t, 'discursivas', 'disc-' + Object.keys(r.disc)[0], 'desempenho', 'fontes']) {
      await ir(pc, rota);
      const n = await pc.$$eval('a[href],button:not([disabled]),input,select,textarea,summary,[tabindex="0"]', e => e.filter(x => x.getClientRects().length).length);
      await pc.focus('#main');
      await pc.evaluate(() => scrollTo(0, 0));
      for (let i = 0; i < Math.min(n, 60); i++) {
        await pc.keyboard.press('Tab');
        const f = await pc.evaluate(() => { const a = document.activeElement; if (a === document.body) return null; const alvo = a.matches('.sr') ? a.closest('label') : a, s = getComputedStyle(alvo); return { ok: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2, nome: a.tagName + '.' + a.className }; });
        if (!f) break; total++; if (!f.ok) sem.push(rota + ': ' + f.nome);
      }
    }
    conferir(sem.length === 0, `todos os ${total} focos percorridos têm contorno visível ` + [...new Set(sem)].slice(0, 5).join(' ; '));
    await pc.context().close();
  }

  // Simulado em andamento em outro concurso não pode ser apagado sem aviso.
  {
    const pg = await abrir();
    await pg.click('[data-a="perfil"][data-v="esposa"]'); await pg.waitForSelector('#trilha-sel');
    await pg.selectOption('#trilha-sel', 'cgu-aud'); await ir(pg, 'simulados');
    await pg.click('[data-a="sim-novo"][data-v="rapido"]'); await pg.waitForSelector('#relogio');
    await pg.click('[data-a="sim-marca"][data-v="true"]');
    await pg.selectOption('#trilha-sel', 'cam-al'); await ir(pg, 'simulados');
    await pg.click('[data-a="sim-novo"][data-v="rapido"]');
    conferir(!!(await pg.$('.modal')), 'começar simulado em outro concurso pede confirmação');
    await pg.click('#m-nao');
    conferir(await pg.evaluate(() => P().sim.trilha === 'cgu-aud' && Object.keys(P().sim.r).length === 1), 'desistir mantém o simulado e as marcações');
    await pg.context().close();
  }

  // FIM
  conferir(erros.length === 0, 'nenhum erro no console: ' + (erros.join(' | ') || 'zero'));
  await nav.close(); srv.fechar();
  console.log(`\n${oks} ok, ${falhas.length} falhas`);
  process.exit(falhas.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
