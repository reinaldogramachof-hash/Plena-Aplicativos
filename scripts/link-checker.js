const fs = require('fs');
const path = require('path');
const http = require('http');

const HOST = 'localhost';
const PORT = 8080;

function readFile(file) {
  return fs.readFileSync(path.join(process.cwd(), file), 'utf-8');
}

function checkUrl(url) {
  return new Promise((resolve) => {
    const req = http.request(
      { host: HOST, port: PORT, path: `/${url}`, method: 'GET' },
      (res) => resolve({ url, status: res.statusCode })
    );
    req.on('error', (err) => resolve({ url, status: 0, error: String(err.message || err) }));
    req.end();
  });
}

function extractAppLinksFromIndex(indexHtml) {
  const links = [];
  const linkRegex = /link:\s*["'](apps\.plus\/[^"']+index\.html)["']/g;
  let m;
  while ((m = linkRegex.exec(indexHtml))) links.push(m[1]);
  return Array.from(new Set(links));
}

function extractLinksFromHtmlAnchors(html) {
  const links = [];
  const anchorRegex = /href=["'](apps\.plus\/[^"']+index\.html)["']/g;
  let m;
  while ((m = anchorRegex.exec(html))) links.push(m[1]);
  return Array.from(new Set(links));
}

async function main() {
  const rootFiles = ['index.html', 'servicos.html', 'restaurantes.html'];
  const allLinks = new Set();

  for (const f of rootFiles) {
    if (!fs.existsSync(path.join(process.cwd(), f))) continue;
    const html = readFile(f);
    if (f === 'index.html') {
      extractAppLinksFromIndex(html).forEach((l) => allLinks.add(l));
    }
    extractLinksFromHtmlAnchors(html).forEach((l) => allLinks.add(l));
  }

  const links = Array.from(allLinks);
  if (links.length === 0) {
    console.log('Nenhum link de apps.plus encontrado.');
    return;
  }

  console.log(`Verificando ${links.length} links...`);
  const results = await Promise.all(links.map(checkUrl));
  const failures = results.filter((r) => r.status !== 200);

  for (const r of results) {
    console.log(`${r.status} - ${r.url}${r.error ? ` - ${r.error}` : ''}`);
  }

  // Testes negativos: rotas inexistentes e diretório sem index.html
  const negativeTests = [
    'apps.plus/rota_inexistente/index.html',
    'apps.plus/plena_financas/naoexiste.html',
    'apps.plus/', // deve tentar index.html no diretório raiz de apps.plus e falhar
  ];
  console.log('Executando testes negativos (esperado 404)...');
  const negResults = await Promise.all(negativeTests.map(checkUrl));
  for (const r of negResults) {
    console.log(`${r.status} - ${r.url}${r.error ? ` - ${r.error}` : ''}`);
  }
  const negFailures = negResults.filter((r) => r.status !== 404);

  if (failures.length > 0) {
    console.error(`Falhas: ${failures.length}`);
    process.exitCode = 1;
  } else if (negFailures.length > 0) {
    console.error(`Falhas negativas (404 esperado) incorretas: ${negFailures.length}`);
    process.exitCode = 1;
  } else {
    console.log('Todos os links retornaram 200/OK e negativos retornaram 404/Not Found.');
  }
}

main().catch((e) => {
  console.error('Erro no link-checker:', e);
  process.exitCode = 1;
});
