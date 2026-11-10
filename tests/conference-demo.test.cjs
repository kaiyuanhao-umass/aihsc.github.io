const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const panel = JSON.parse(fs.readFileSync(path.join(root, 'demo-genes.json'), 'utf8'));
const app = fs.readFileSync(path.join(root, 'dist/app.js'), 'utf8');
const helper = fs.readFileSync(path.join(root, 'dist/tcr-expression.js'), 'utf8');
const page = fs.readFileSync(path.join(root, 'dist/demo/index.html'), 'utf8');
assert.equal(panel.genes.length, 130);
assert.deepEqual([...new Set(Object.values(panel.panels).flat())], panel.genes);
assert.equal(new Set([...panel.panels.activated_cd8_heatmap, ...panel.panels.inflammatory_heatmap, ...panel.panels.myeloid_dotplot]).size, 107);
for (const gene of ['Nr4a1','Nr4a2','Nr4a3','Dgkh','Nkg7','Klrb1c','Il6','Ccl2','Ccl5']) assert(panel.genes.includes(gene));
assert(page.includes('data-public-demo="true"'));
assert(!/access-password|access-gate|site-locked|Private preview|34 test genes|<base\b/.test(page));
assert(page.includes('130 selected genes') && !page.includes('href="gene-list.tsv"'));
const demoURL = 'https://kaiyuanhao-umass.github.io/aihsc.github.io/demo/';
for (const source of ['../app.js?v=20261110-25', '../styles.css?v=20261110-22', '../tcr-expression.js?v=20261110-22']) {
  assert(page.includes(source));
  assert(fs.existsSync(path.resolve(root, 'dist/demo', source.split('?')[0])));
}
assert(fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8').includes('class="site-locked"'));
assert.equal(fs.readFileSync(path.join(root, 'dist/demo/demo-url.txt'), 'utf8').trim(), demoURL);

// Public entry must start on a fresh device, without a stored session or form.
const accessCode = app.slice(app.indexOf('function initializeAccess()'));
for (const publicDemo of [true, false]) {
  let starts = 0, registrations = 0;
  vm.runInNewContext(accessCode, {
    document: {body: {dataset: {publicDemo: String(publicDemo)}}, querySelector(selector) {
      assert(!publicDemo); assert.equal(selector, '#access-form');
      return {addEventListener() { registrations++; }};
    }},
    startAtlas() { starts++; },
    sessionStorage: {getItem() { assert(!publicDemo); return null; }}
  });
  assert.equal(starts, publicDemo ? 1 : 0);
  assert.equal(registrations, publicDemo ? 0 : 1);
}

(async () => {
  const requested = [];
  const scriptURL = new URL('../app.js?v=20261110-25', demoURL).href;
  const context = vm.createContext({URL, document: {querySelector(selector) {
    assert.equal(selector, '#atlas-app'); return {src: scriptURL};
  }}, fetch: async url => {
    requested.push(url.href);
    assert(url.href.startsWith('https://kaiyuanhao-umass.github.io/aihsc.github.io/data/'));
    const payload = JSON.parse(fs.readFileSync(path.join(root, 'dist/data', path.basename(url.pathname)), 'utf8'));
    return {ok: true, json: async () => payload};
  }});
  const validGene = app.match(/^function validGene.*$/m)[0];
  vm.runInContext(helper + '\n' + app.slice(0, app.indexOf('window.addEventListener("resize"')) + '\n' + validGene + '\nthis.load=loadDataset;this.findGene=validGene;', context);
  for (const id of ['liver_broad', 'monomac', 't_cells', 'cd8_activated']) {
    const data = await context.load(id);
    assert.deepEqual(data.genes, panel.genes);
    assert.equal(data.columns.length, 136);
    assert.equal(data.total_cells, data.cells.length);
    assert.equal(data.total_cells, data.annotations.reduce((n, a) => n + a.cells, 0));
    for (const clone of data.clones || []) {
      for (const chain of ['cdr3_alpha', 'cdr3_beta']) assert(clone[chain] === null || typeof clone[chain] === 'string', `${id} ${clone.id}: missing chains must remain null`);
      assert(clone.cdr3_alpha || clone.cdr3_beta);
    }
    for (const gene of panel.genes) {
      assert.equal(context.findGene(data, gene.toLowerCase()), gene);
      assert.equal(data.columns[data.geneIndex[gene]], gene);
    }
    for (const row of data.cells) {
      assert.equal(row.length, 136);
      assert(row.every(Number.isFinite));
      assert(row.slice(6).every(value => value >= 0));
    }
  }
  await context.load('t_cells');
  assert.equal(requested.length, 4, 'Switching explorers should reuse cached data');
  console.log('PASS: public access on fresh devices, preview access retained, demo asset/data paths, all 130 genes searchable in all four datasets, and complete finite expression rows.');
})().catch(error => { console.error(error); process.exitCode = 1; });
