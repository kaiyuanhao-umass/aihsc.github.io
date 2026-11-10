const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, 'dist/tcr-expression.js'), 'utf8') + ';this.api=TcrExpression;', context);
const api = context.api;
const data = JSON.parse(fs.readFileSync(path.join(root, 'dist/data/t_cells.json'), 'utf8'));
assert.equal(data.cells.length, 25952);
assert.equal(data.genes.length, 34);
assert.equal(data.annotations.length, 10);
assert.deepEqual(data.expansion_levels, ['Unexpanded', 'Medium', 'Large']);
const sizes = Object.fromEntries(data.expansion_levels.map((name,index)=>[name,data.cells.filter(r=>r[4]===index).length]));
assert.deepEqual(sizes, {Unexpanded:23998,Medium:1557,Large:397});
assert.equal(data.cells.filter(r=>r[5]<0).length, 2816);
assert(data.cells.filter(r=>r[5]<0).every(r=>r[4]===0));
assert.equal(data.cells.filter(r=>r[3]===0).length, 15127);
assert.equal(data.cells.filter(r=>r[3]===1).length, 10825);
const counts = Array(data.clones.length).fill(0);
for(const row of data.cells) {
  assert.equal(row.length,40);
  assert(row.every(Number.isFinite));
  if(row[5]<0)continue;
  const clone=data.clones[row[5]];
  assert.equal(row[3],clone.genotype==='DKO'?1:0);
  assert(['HET1','HET2','DKO1','DKO2'].includes(clone.sample));
  counts[row[5]]++;
}
assert.equal(data.clones.length,20137);
assert.deepEqual(counts,data.clones.map(c=>c.cells));
const top=api.topClones(data);
assert.deepEqual(Array.from(top,([,n])=>n),[115,103,84,61,56,45,42,41,36,35,33,32,31,30,30]);
for(const [cloneIndex] of top) {
  const expected=new Set(data.cells.filter(r=>r[5]===cloneIndex).map(r=>data.annotations[r[2]].name));
  assert.deepEqual(new Set(api.cloneSubsets(data,cloneIndex)),expected);
}
for(const gene of data.genes) {
  const column=6+data.genes.indexOf(gene);
  for(const mode of ['expansion','clones']) {
    const groups=api.groups(data,gene,mode,top);
    assert.equal(groups.length,mode==='expansion'?3:17);
    assert.deepEqual(Array.from(groups).flatMap(g=>Array.from(g.values)).sort((a,b)=>a-b),data.cells.map(r=>r[column]).sort((a,b)=>a-b));
    for(const g of groups) {
      const rows=data.cells.filter(r=>mode==='expansion'?data.expansion_levels[r[4]]===g.name:g.name==='No TCR assigned'?r[5]<0:g.name==='Other clones'?r[5]>=0&&!top.some(([i])=>i===r[5]):r[5]>=0&&data.clones[r[5]].id===g.name);
      assert.deepEqual(Array.from(g.values),rows.map(r=>r[column]));
    }
  }
}
for(const mode of ['expansion','clones']) {
  const svg=api.svg(api.groups(data,'Gzmk',mode),'Gzmk',490,464);
  assert(!/NaN|Infinity/.test(svg));
  assert.equal((svg.match(/class="violin-point"/g)||[]).length,25952);
}
console.log('PASS: total T-cell counts, sample-specific clone membership, all subset labels, 34-gene group membership including zeros, and both violin modes.');
