// Prova de que o progresso salvo continua funcionando.
//   Grava a referência a partir de uma versão antiga: node tests/regressao.js --gravar --raiz <pasta>
//   Compara a versão atual com a referência:           node tests/regressao.js
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { RAIZ, CHAVE, servir, contexto, vigiar, ir, cenario, lerProgresso, chromium } = require('./comum');

const REF = path.join(__dirname, 'referencia', 'progresso-gerado.json');
const arg = process.argv, gravar = arg.includes('--gravar');
const raiz = arg.includes('--raiz') ? path.resolve(arg[arg.indexOf('--raiz') + 1]) : RAIZ;
const sha = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
const falhas = [], ok = [];
const conferir = (cond, msg) => { (cond ? ok : falhas).push(msg); console.log((cond ? 'ok    ' : 'FALHA ') + msg); };

(async () => {
  const srv = await servir(raiz), nav = await chromium.launch(), erros = [];

  // 1. Gera o progresso pela interface.
  const c1 = await contexto(nav, { permissions: ['clipboard-read', 'clipboard-write'] });
  const pg = await c1.newPage(); vigiar(pg, erros);
  const gerado = await cenario(pg, srv.base);
  if (gravar) {
    fs.writeFileSync(REF, JSON.stringify(gerado, null, 1) + '\n');
    console.log('Referência gravada. sha256:', sha(gerado.v1));
  }
  const ref = JSON.parse(fs.readFileSync(REF, 'utf8'));
  const S = JSON.parse(ref.v1);
  console.log(`Antes  sha256 ${sha(ref.v1)} (${ref.v1.length} bytes)\nDepois sha256 ${sha(gerado.v1)} (${gerado.v1.length} bytes)`);
  conferir(gerado.v1 === ref.v1, 'progresso gerado é idêntico, byte a byte, ao da versão de referência');
  conferir(gerado.tema === ref.tema, 'tema salvo é igual ao da referência');

  // 2. Recarrega: nada pode mudar e tudo tem de aparecer.
  await pg.reload(); await pg.waitForSelector('.cartao');
  conferir((await lerProgresso(pg)).v1 === gerado.v1, 'recarregar não altera o que está salvo');
  const r = S.perfis.rodrigo, nResp = Object.keys(r.resp).length, nOk = Object.values(r.resp).filter(x => x.ok).length;
  const bolhasOk = await pg.$$eval('.bolhas .b.ok', e => e.length), bolhasNo = await pg.$$eval('.bolhas .b.no', e => e.length);
  conferir(bolhasOk === nOk && bolhasNo === nResp - nOk, `cartão-resposta mostra ${bolhasOk} acertos e ${bolhasNo} erros, iguais ao salvo`);
  await ir(pg, 'simulados');
  conferir(await pg.$eval('.aviso', e => e.textContent.includes('Simulado em andamento')), 'simulado em andamento continua listado');
  conferir((await pg.$$('.tab tbody tr')).length === r.sims.length, 'histórico mostra o simulado entregue');
  await ir(pg, 'simulado-ativo');
  const marc = await pg.$$eval('.grade-c .res', e => e.length);
  conferir(marc === Object.keys(r.sim.r).length, 'simulado em andamento mantém as marcações');
  await ir(pg, 'simulado-' + r.sims[0].t);
  conferir(!!(await pg.$('.placar')), 'resultado do simulado abre');
  await ir(pg, 'disc-' + Object.keys(r.disc)[0]);
  conferir((await pg.inputValue('#redacao')) === r.disc[Object.keys(r.disc)[0]].tx, 'texto da discursiva continua lá');
  await ir(pg, 'inicio');

  // 3. O código de progresso continua sendo o mesmo JSON.
  await ir(pg, 'desempenho');
  await pg.click('[data-a="exp-copia"]');
  await pg.waitForSelector('.toast');
  const cod = await pg.evaluate(() => navigator.clipboard.readText());
  conferir(cod === await pg.evaluate(k => localStorage.getItem(k), CHAVE), 'código de progresso é o conteúdo salvo, no mesmo formato');

  // 4. Outro aparelho: o código da versão de referência entra na versão atual.
  const c2 = await contexto(nav); const pg2 = await c2.newPage(); vigiar(pg2, erros);
  await pg2.goto(srv.base + '/#desempenho');
  await pg2.fill('#imp-tx', ref.v1);
  await pg2.click('[data-a="imp-cola"]');
  await pg2.waitForSelector('.toast');
  const dep = JSON.parse((await lerProgresso(pg2)).v1);
  for (const k of Object.keys(S.perfis)) for (const c of ['resp', 'fav', 'vistas', 'marcas', 'rev', 'disc', 'dia', 'sims'])
    conferir(JSON.stringify(dep.perfis[k][c]) === JSON.stringify(S.perfis[k][c]), `juntar código antigo preserva ${k}.${c}`);

  // 5. Quem já tem progresso salvo pela versão antiga abre a versão atual.
  const c3 = await contexto(nav); const pg3 = await c3.newPage(); vigiar(pg3, erros);
  await c3.addInitScript(([k, v]) => { if (!sessionStorage.getItem('x')) { localStorage.setItem(k, v); sessionStorage.setItem('x', '1'); } }, [CHAVE, ref.v1]);
  await pg3.goto(srv.base + '/#inicio'); await pg3.waitForSelector('.cartao');
  await pg3.reload(); await pg3.waitForSelector('.cartao');
  conferir((await lerProgresso(pg3)).v1 === ref.v1, 'progresso salvo pela versão antiga abre sem ser alterado');

  conferir(erros.length === 0, 'nenhum erro no console: ' + (erros.join(' | ') || 'zero'));
  await nav.close(); srv.fechar();
  console.log(`\n${ok.length} ok, ${falhas.length} falhas`);
  process.exit(falhas.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
