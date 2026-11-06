// Funções compartilhadas pelos testes. Rodar com: NODE_PATH=$(npm root -g) node tests/<arquivo>.js
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib');
const { chromium } = require('playwright');

const RAIZ = path.resolve(__dirname, '..');
const CHAVE = 'cartao-resposta.v1';
const INICIO = Date.parse('2026-11-20T12:00:00-04:00');

// Servidor local parecido com o GitHub Pages: gzip e cache de 10 minutos.
function servir(raiz = RAIZ, trocar = {}) {
  const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json' };
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const arq = path.join(raiz, p);
    if (!arq.startsWith(raiz) || !fs.existsSync(arq) || fs.statSync(arq).isDirectory()) { res.writeHead(404); return res.end('nao encontrado'); }
    let corpo = trocar[p] !== undefined ? Buffer.from(trocar[p]) : fs.readFileSync(arq);
    const h = { 'Content-Type': tipos[path.extname(arq)] || 'application/octet-stream', 'Cache-Control': 'max-age=600' };
    if (/html|javascript/.test(h['Content-Type'])) { corpo = zlib.gzipSync(corpo); h['Content-Encoding'] = 'gzip'; }
    res.writeHead(200, h); res.end(corpo);
  });
  return new Promise(ok => srv.listen(0, '127.0.0.1', () => ok({ base: `http://localhost:${srv.address().port}`, fechar: () => srv.close() })));
}

// O ambiente de teste não acessa o Google Fonts: responde vazio para testar só o site.
async function bloquearFontes(alvo) {
  await alvo.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
}

const contexto = async (nav, op = {}) => {
  const c = await nav.newContext({ viewport: { width: 1366, height: 800 }, locale: 'pt-BR', timezoneId: 'America/Cuiaba', serviceWorkers: 'block', ...op });
  await bloquearFontes(c);
  return c;
};

// Registra erros do console e exceções da página.
function vigiar(page, erros) {
  page.on('console', m => { if (m.type() === 'error') erros.push('console: ' + m.text()); });
  page.on('pageerror', e => erros.push('exceção: ' + e.message));
}

// Math.random previsível: o sorteio do simulado fica igual em toda execução.
const sementeAleatoria = () => { let s = 12345; Math.random = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };

async function ir(page, h) {
  await page.evaluate(h => new Promise(r => {
    if (location.hash === '#' + h) return r();
    addEventListener('hashchange', () => setTimeout(r, 0), { once: true });
    location.hash = h;
  }), h);
}

// Progresso de exemplo: tudo feito pela interface, com relógio e sorteio fixos.
async function cenario(page, base) {
  let min = 0;
  const passo = () => page.clock.setFixedTime(new Date(INICIO + (min++) * 60000));
  const clicar = async s => { await passo(); await page.click(s); };
  await page.clock.setFixedTime(new Date(INICIO));
  await page.addInitScript(sementeAleatoria);
  await page.goto(base + '/#inicio');
  await page.waitForSelector('.cartao');

  await page.check('[data-marca="insc-cam"]');

  const curta = await page.evaluate(() => aulasTrilha('cam-ti').find(a => !a.modulos).id);
  await ir(page, 'aula-' + curta);
  await clicar('[data-a="nivel"][data-v="concurseiro"]');
  await clicar('[data-a="vista"]');

  const longa = await page.evaluate(() => aulasTrilha('cam-ti').find(a => a.modulos).id);
  await ir(page, 'aula-' + longa);
  await clicar('[data-a="mod-ok"]');
  await clicar('[data-a="mod-ok"]');
  await clicar('[data-a="mod-ir"][data-v="0"]');

  await ir(page, 'questoes');
  await page.selectOption('#f-disc', 'por');
  const ids = await page.$$eval('article.q', e => e.map(x => x.id.slice(2)));
  const gab = await page.evaluate(i => QUEST[i].ans, ids[0]);
  await clicar(`[data-a="riscar"][data-q="${ids[0]}"][data-v="${(gab + 1) % 4}"]`);
  await clicar(`[data-a="marcar"][data-q="${ids[0]}"][data-v="${gab}"]`);
  await clicar(`[data-a="responder"][data-v="${ids[0]}"]`);
  const gab1 = await page.evaluate(i => QUEST[i].ans, ids[1]);
  await clicar(`[data-a="marcar"][data-q="${ids[1]}"][data-v="${(gab1 + 1) % 4}"]`);
  await clicar(`[data-a="responder"][data-v="${ids[1]}"]`);
  await clicar(`[data-a="fav"][data-v="${ids[2]}"]`);

  const dsc = await page.evaluate(() => DB.discursivas.filter(d => d.trilha === 'cam-ti').map(d => d.id));
  await ir(page, 'disc-' + dsc[0]);
  await page.fill('#redacao', 'Texto de exemplo.\nSegunda linha do teste.');
  await clicar('[data-a="d-ver"]');
  await page.check('[data-esp="0"]');
  await page.fill('#d-forma', '15');
  await page.press('#d-forma', 'Tab');
  await ir(page, 'disc-' + dsc[1]);
  await page.fill('#redacao', 'Rascunho que fica sem correção.');

  await ir(page, 'simulados');
  await clicar('[data-a="sim-novo"][data-v="rapido"]');
  await page.waitForSelector('#relogio');
  for (let i = 0; i < 3; i++) {
    await clicar('[data-a="sim-marca"]');
    await clicar('.bt[data-a="sim-ir"]:not([disabled]):last-child');
    await page.waitForFunction(i => P().sim.i === i + 1, i);
  }
  await clicar('[data-a="sim-risca"]');
  await clicar('[data-a="sim-pausa"]');
  await clicar('[data-a="sim-pausa"]');
  await clicar('[data-a="sim-marca"]');
  await clicar('[data-a="sim-limpa"]');
  await clicar('[data-a="sim-fim"]');
  await clicar('#m-sim');
  await page.waitForSelector('.placar');
  await ir(page, 'simulados');
  await clicar('[data-a="sim-novo"][data-v="meia"]');
  await page.waitForSelector('#relogio');
  await clicar('[data-a="sim-marca"]');

  await clicar('[data-a="perfil"][data-v="esposa"]');
  await page.waitForSelector('#trilha-sel');
  await page.selectOption('#trilha-sel', 'cgu-aud');
  await ir(page, 'questoes');
  const ce = (await page.$$eval('article.q', e => e.map(x => x.id.slice(2))))[0];
  await clicar(`[data-a="marcar"][data-q="${ce}"][data-v="true"]`);
  await clicar(`[data-a="responder"][data-v="${ce}"]`);
  await clicar('.lado-pe [data-a="tema"]');
  await clicar('[data-a="perfil"][data-v="rodrigo"]');
  await page.waitForSelector('.cartao');
  return lerProgresso(page);
}

const lerProgresso = page => page.evaluate(k => ({ v1: localStorage.getItem(k), tema: localStorage.getItem(k + '.tema') }), CHAVE);

module.exports = { RAIZ, CHAVE, INICIO, servir, bloquearFontes, contexto, vigiar, ir, cenario, lerProgresso, sementeAleatoria, chromium };
