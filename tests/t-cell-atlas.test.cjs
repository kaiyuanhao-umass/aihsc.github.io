const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'dist/data/t_cells.json'), 'utf8'));
const app = fs.readFileSync(path.join(root, 'dist/app.js'), 'utf8');
const helper = fs.readFileSync(path.join(root, 'dist/tcr-expression.js'), 'utf8');

const expected = [
  ['Activated CD8+ T cells', 3683, 136, 3547, '#dc7369'],
  ['RORg+ gd T cells', 539, 220, 319, '#5E9789'],
  ['Naive CD8+ T cells', 6917, 5430, 1487, '#dad4b9'],
  ['ITGA1+ CD4+ T cells', 1440, 1047, 393, '#78B7D9'],
  ['CD40LG+ CD4+ T cells', 858, 625, 233, '#9DCAF1'],
  ['CD8aa IELs', 2959, 459, 2500, '#C8CDCF'],
  ['Treg', 638, 324, 314, '#446E9C'],
  ['Naive CD4+ T cells', 8093, 6425, 1668, '#CBE0F0'],
  ['Proliferating T cells', 231, 37, 194, '#CDB6DA'],
  ['Naive gd T cells', 594, 424, 170, '#6FB3A2']
];
assert.equal(data.annotations.length, expected.length);
data.geneIndex = Object.fromEntries(data.genes.map((gene, i) => [gene, i + 6]));
for (let i = 0; i < expected.length; i++) {
  const [name, total, het, dko] = expected[i], a = data.annotations[i];
  assert.deepEqual([a.name, a.cells, a.control, a.aih], [name, total, het, dko]);
  const cells = data.cells.filter(row => row[2] === i);
  assert.equal(cells.length, total);
  assert.equal(cells.filter(row => row[3] === 0).length, het);
  assert.equal(cells.filter(row => row[3] === 1).length, dko);
}

// Test the actual UmapPlot renderer with conservative text widths. Optional
// native Canvas rendering additionally checks real fonts and saves PNGs;
// neither path uses a browser or changes the source coordinates.
const output = process.env.T_CELL_RENDER_DIR;
const native = output ? require('@napi-rs/canvas') : null;
if (output) fs.mkdirSync(output, {recursive: true});
const separate = (a, b) => a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;
const context = vm.createContext({window: {devicePixelRatio: 1}, document: {body: {}}, getComputedStyle: () => ({fontFamily: 'Arial, sans-serif'})});
vm.runInContext(helper + '\n' + app.slice(0, app.indexOf('window.addEventListener("resize"'))
  + '\nthis.Plot=UmapPlot;this.config=DATASETS.t_cells;', context);
assert.deepEqual(Array.from(context.config.colors), expected.map(row => row[4]));
assert.equal(context.config.drilldown['Activated CD8+ T cells'], 'cd8_activated');
assert.equal(Object.keys(context.config.drilldown).length, 1);

// Phone widths account for the page's 16px side padding and workspace border.
// Their explicit heights no longer transfer a 460px minimum to the grid width.
for (const [width, height] of [[286,440], [326,440], [341,440], [356,440], [380,440], [396,452], [280,460], [320,460], [360,460], [400,460], [480,480], [620,620], [800,800], [380,460], [500,510]]) {
  const ctx = {setTransform(){},clearRect(){},beginPath(){},arc(){},fill(){},moveTo(){},lineTo(){},stroke(){},strokeText(){},fillText(){},
    measureText(text) { return {width: Array.from(text).length * parseFloat(this.font.split(' ')[1]) * .62}; }};
  const canvas = native ? native.createCanvas(width, height) : {getContext: () => ctx};
  Object.assign(canvas, {clientWidth: width, clientHeight: height, isConnected: true, addEventListener(){}, getBoundingClientRect: () => ({width, height})});
  context.window.devicePixelRatio = width < 480 ? 2 : 1;
  const plot = new context.Plot(canvas);
  let combinedLayout;
  for (const condition of ['all', 'HET', 'DKO']) {
    plot.set(data, {mode: 'annotation', condition, onLabelClick(){}});
    assert.equal(canvas.width, width * context.window.devicePixelRatio);
    assert.equal(canvas.height, height * context.window.devicePixelRatio);
    assert.equal(plot.labelBoxes.length, 10);
    const layout = JSON.stringify(plot.labelBoxes.map(({x,y,width,height}) => ({x,y,width,height})));
    if (combinedLayout) assert.equal(layout, combinedLayout, 'Condition filters must retain label positions');
    combinedLayout = layout;
    for (const box of plot.labelBoxes) {
      assert(box.x >= 20 && box.y >= 8 && box.x + box.width <= width - 8 && box.y + box.height <= height - 25, 'Label clipped or overlaps axes');
      const annotation = data.annotations[box.index];
      const anchor = {x: plot.tr.x(annotation.x), y: plot.tr.y(annotation.y)};
      const end = {x: Math.max(box.x, Math.min(box.x + box.width, anchor.x)), y: Math.max(box.y, Math.min(box.y + box.height, anchor.y))};
      const leaderLength = Math.hypot(end.x - anchor.x, end.y - anchor.y);
      assert(leaderLength <= (width < 480 ? 64 : 130), `${box.name} drifts too far from its cluster at ${width}px`);
      // Sample the actual connector every pixel: another annotation must never
      // interrupt it or make the population association ambiguous.
      const steps = Math.max(1, Math.ceil(leaderLength));
      for (let step = 0; step <= steps; step++) {
        const x = anchor.x + (end.x - anchor.x) * step / steps;
        const y = anchor.y + (end.y - anchor.y) * step / steps;
        for (const other of plot.labelBoxes) if (other !== box) {
          assert(x < other.x || x > other.x + other.width || y < other.y || y > other.y + other.height, `${box.name} connector crosses ${other.name}`);
        }
      }
      for (const other of plot.labelBoxes) if (other !== box) assert(separate(box, other), `${box.name} overlaps ${other.name}`);
      for (const row of data.cells) {
        const dot = {x: plot.tr.x(row[0]) - 1.25, y: plot.tr.y(row[1]) - 1.25, width: 2.5, height: 2.5};
        assert(separate(box, dot), `${box.name} covers a dot at ${width} × ${height}`);
      }
    }
    assert(plot.labelBoxes.find(box => box.name === 'Activated CD8+ T cells').clickable);
    if (native && condition === 'all') {
      const drawing = canvas.getContext('2d');
      drawing.globalCompositeOperation = 'destination-over'; drawing.fillStyle = '#fff'; drawing.fillRect(0, 0, width, height);
      fs.writeFileSync(path.join(output, `t-cells-${width}x${height}.png`), canvas.toBuffer('image/png'));
      drawing.globalCompositeOperation = 'source-over';
    }
  }
  const positions = data.cells.map(row => [plot.tr.x(row[0]), plot.tr.y(row[1])]);
  for (const mode of ['gene', 'expansion', 'clones']) {
    plot.set(data, {mode, gene: 'Gzmk', matchAnnotationLayout: true});
    assert.deepEqual(data.cells.map(row => [plot.tr.x(row[0]), plot.tr.y(row[1])]), positions, 'Paired UMAPs must align');
  }
}
console.log('PASS: 10 manuscript groups/colors, merged CD8 counts/drilldown, nearby labels with clear connectors, no label/dot or label/label overlap, viewport bounds, stable condition labels, and aligned paired UMAPs.');
