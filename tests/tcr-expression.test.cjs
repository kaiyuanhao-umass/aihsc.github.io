const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname,'..');
const helper = fs.readFileSync(path.join(root,'dist/tcr-expression.js'),'utf8');
const context = vm.createContext({});
vm.runInContext(helper+';this.api=TcrExpression;',context);
const api = context.api;
const data = JSON.parse(fs.readFileSync(path.join(root,'dist/data/cd8_activated.json'),'utf8'));
assert.deepEqual(data.genes, JSON.parse(fs.readFileSync(path.join(root, 'demo-genes.json'), 'utf8')).genes);
const top = api.topClones(data);
assert.equal(top.length,15);
assert.equal(new Set(top.map(([index])=>index)).size,15);
const counts = Array(data.clones.length).fill(0);
for (const row of data.cells) if(row[5]>=0) counts[row[5]]++;
const expectedTop = counts.map((n,i)=>[i,n]).filter(([,n])=>n>1).sort((a,b)=>b[1]-a[1]||a[0]-b[0]).slice(0,15);
assert.deepEqual(JSON.parse(JSON.stringify(top)),expectedTop);
for(const gene of data.genes) {
  const index=data.genes.indexOf(gene)+6;
  for(const mode of ['expansion','clones']) {
    const groups=api.groups(data,gene,mode,top);
    assert.equal(groups.reduce((n,g)=>n+g.values.length,0),data.cells.length);
    assert.equal(groups.reduce((n,g)=>n+g.values.filter(v=>v===0).length,0),data.cells.filter(r=>r[index]===0).length);
    assert.deepEqual(Array.from(groups).flatMap(g=>Array.from(g.values)).sort((a,b)=>a-b),data.cells.map(r=>r[index]).sort((a,b)=>a-b));
    for(const g of groups) {
      let selected;
      if(mode==='expansion')selected=data.cells.filter(r=>data.expansion_levels[r[4]]===g.name);
      else if(g.name==='No TCR assigned')selected=data.cells.filter(r=>r[5]<0);
      else if(g.name==='Other clones')selected=data.cells.filter(r=>r[5]>=0&&!top.some(([i])=>i===r[5]));
      else selected=data.cells.filter(r=>r[5]>=0&&data.clones[r[5]].id===g.name);
      assert.deepEqual(Array.from(g.values),selected.map(r=>r[index]));
    }
  }
}
assert.throws(()=>api.groups(data,'NotARealGene','clones'));
assert.equal(api.SIZE_COLORS.Unexpanded,'#d3d3d3');
assert.equal(api.SIZE_COLORS.Medium,'#c82423');
assert.equal(api.SIZE_COLORS.Large,'#D09922');
assert.equal(new Set(api.CLONE_COLORS).size,15);
for(const values of [[0,0,0],[0],[2,2],[0,1,4]]) {
  const svg=api.svg([{name:'test',label:'test',color:'#cccccc',values}],'Test',400,420);
  assert(!/NaN|Infinity/.test(svg));
  assert.equal((svg.match(/class="violin-point"/g)||[]).length,values.length);
  if(new Set(values).size===1)assert(!svg.includes('class="violin-density"'));
}
const cloneSvg=api.svg(api.groups(data,'Gzmk','clones'),'Gzmk',400,420);
assert.equal((cloneSvg.match(/class="violin-point"/g)||[]).length,data.cells.length);
assert.equal((cloneSvg.match(/class="violin-group"/g)||[]).length,17);
assert(!/NaN|Infinity/.test(cloneSvg));
const app=fs.readFileSync(path.join(root,'dist/app.js'),'utf8');
const draws=[];
const ctx={setTransform(){},clearRect(){},beginPath(){},arc(x,y,r){this.radius=r;},fill(){draws.push({color:this.fillStyle,radius:this.radius});}};
const canvas={isConnected:true,clientWidth:400,clientHeight:400,getContext(){return ctx;},addEventListener(){},getBoundingClientRect(){return {width:400,height:400};}};
const drawContext=vm.createContext({canvas,window:{devicePixelRatio:1}});
vm.runInContext(helper+'\n'+app.slice(0,app.indexOf('window.addEventListener("resize"'))+'\nthis.plot=new UmapPlot(canvas);',drawContext);
const fixture={id:'cd8_activated',total_cells:3,cells:[[0,0,0,0,0,1],[1,1,1,1,1,-1],[2,2,2,1,2,2]],expansion_levels:['Unexpanded','Medium','Large']};
drawContext.plot.set(fixture,{mode:'clones',cloneMap:new Map([[1,'#111111'],[2,'#222222']]),labels:false,pointScale:api.POINT_SCALE});
assert.deepEqual(draws.map(x=>x.color),['#d9ddd9','#111111','#222222']);
assert(draws.every(x=>Math.abs(x.radius-1.8)<1e-9));
draws.length=0;
drawContext.plot.set(fixture,{mode:'expansion',labels:false,pointScale:api.POINT_SCALE});
assert.deepEqual(draws.map(x=>x.color),['#d3d3d3','#c82423','#D09922']);
console.log('PASS: all 130 genes preserve cell membership and zeros in both groupings; top 15 ranking/colors, 17 clone groups, constant-value violins, and highlighted-clone drawing order are correct.');

const subsetOrder=['Stem-like','Intermediate','Terminal','Trm','Teff'];
for(const [cloneIndex] of top) {
  const actual=Array.from(api.cloneSubsets(data,cloneIndex,subsetOrder));
  const expected=subsetOrder.filter(name=>data.cells.some(row=>row[5]===cloneIndex&&data.annotations[row[2]].name===name));
  assert.deepEqual(actual,expected);
}
assert(top.some(([index])=>api.cloneSubsets(data,index).length>1));
assert.equal(api.POINT_SCALE,.9);
console.log('PASS: every top-15 clone lists all of its distinct subsets, including multi-subset clones; TCR point radius is 25% smaller.');
