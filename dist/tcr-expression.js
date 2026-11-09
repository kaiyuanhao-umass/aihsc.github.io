/* Descriptive expression distributions; no between-cell significance tests. */
const TcrExpression = (() => {
  const SIZE_ORDER = ["Unexpanded", "Medium", "Large"];
  const SIZE_COLORS = {Unexpanded: "#d3d3d3", Medium: "#c82423", Large: "#D09922", "No TCR detected": "#e6e6e6"};
  const CLONE_COLORS = ["#dfbd16", "#b79116", "#347bc1", "#a49bc8", "#eb912b", "#dc545e", "#98bf54", "#865e60", "#318d83", "#26b2b4", "#805eaf", "#dd8fb4", "#667c39", "#bc6940", "#466c83"];
  const escape = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  function topClones(data, limit = 15) {
    const counts = new Map();
    data.cells.forEach(row => { if (row[5] >= 0) counts.set(row[5], (counts.get(row[5]) || 0) + 1); });
    return [...counts].filter(([, count]) => count > 1).sort((a,b) => b[1]-a[1] || a[0]-b[0]).slice(0,limit);
  }

  function groups(data, gene, mode, top = topClones(data)) {
    const geneIndex = data.genes.indexOf(gene);
    if (geneIndex < 0) throw new Error("Gene is not available in this preview.");
    let result;
    if (mode === "expansion") {
      const names = [...SIZE_ORDER, ...data.expansion_levels.filter(name => !SIZE_ORDER.includes(name))];
      result = names.map(name => ({name, label: name, color: SIZE_COLORS[name] || "#e6e6e6", values: []}));
      const byName = new Map(result.map(group => [group.name, group]));
      data.cells.forEach(row => byName.get(data.expansion_levels[row[4]]).values.push(row[geneIndex+6]));
    } else {
      result = top.map(([index],rank) => ({name: data.clones[index].id, label: data.clones[index].id, sample: data.clones[index].sample, color: CLONE_COLORS[rank], values: []}));
      const byClone = new Map(top.map(([index],rank) => [index,result[rank]]));
      const other = {name: "Other clones", label: "Other clones", color: "#bdbdbd", values: []};
      const missing = {name: "No TCR assigned", label: "No TCR assigned", color: "#e5e5e5", values: []};
      data.cells.forEach(row => (row[5] < 0 ? missing : byClone.get(row[5]) || other).values.push(row[geneIndex+6]));
      result.push(other,missing);
    }
    return result.filter(group => group.values.length);
  }

  function quantile(sorted, p) {
    const index = (sorted.length-1)*p, lower = Math.floor(index);
    return sorted[lower] + (sorted[Math.ceil(index)]-sorted[lower])*(index-lower);
  }

  function summary(values) {
    const sorted = [...values].sort((a,b)=>a-b);
    return {n: values.length, median: quantile(sorted,.5), mean: values.reduce((a,b)=>a+b,0)/values.length, percent: values.filter(v=>v>0).length/values.length*100};
  }

  function bandwidth(values, yMax) {
    const sorted = [...values].sort((a,b)=>a-b), mean = values.reduce((a,b)=>a+b,0)/values.length;
    const sd = Math.sqrt(values.reduce((sum,value)=>sum+(value-mean)**2,0)/Math.max(1,values.length-1));
    const iqr = (quantile(sorted,.75)-quantile(sorted,.25))/1.34;
    const scale = iqr > 0 ? Math.min(sd,iqr) : sd;
    return Math.max(yMax/100, .9*(scale || yMax/10)*values.length**(-.2));
  }

  function density(values, h, steps = 96) {
    const min = Math.min(...values), max = Math.max(...values);
    if (values.length < 2 || min === max) return [];
    // Reflect at zero so smoothing cannot imply negative RNA expression.
    return Array.from({length:steps+1},(_,i)=>{
      const y = min+(max-min)*i/steps;
      const d = values.reduce((sum,x)=>sum+Math.exp(-.5*((y-x)/h)**2)+Math.exp(-.5*((y+x)/h)**2),0)/(values.length*h*Math.sqrt(2*Math.PI));
      return {y,d};
    });
  }

  function svg(groups, gene, availableWidth = 420, height = 420) {
    const width = Math.max(360,availableWidth,64+groups.length*58);
    const margin = {left:55,right:15,top:24,bottom:88};
    const bottom = height-margin.bottom, plotHeight = bottom-margin.top;
    const all = groups.flatMap(group=>group.values), max = Math.max(0,...all);
    const yMax = Math.max(1,Math.ceil(max*1.08*2)/2), h = bandwidth(all,yMax);
    const y = value => bottom-value/yMax*plotHeight;
    const step = (width-margin.left-margin.right)/groups.length, half = Math.min(32,step*.36);
    const ticks = Array.from({length:5},(_,i)=>{
      const value = yMax*i/4, py = y(value);
      return `<line x1="${margin.left}" x2="${width-margin.right}" y1="${py}" y2="${py}" stroke="#edf0ed"/><text x="${margin.left-9}" y="${py+4}" text-anchor="end" class="violin-tick">${Number(value.toFixed(2))}</text>`;
    }).join("");
    const shapes = groups.map((group,groupIndex)=>{
      const cx = margin.left+step*(groupIndex+.5), stat = summary(group.values), curve = density(group.values,h);
      let shape = "";
      if (curve.length) {
        const peak = Math.max(...curve.map(p=>p.d));
        const side = sign => curve.map(p=>`${cx+sign*half*p.d/peak},${y(p.y)}`);
        shape = `<path class="violin-density" d="M ${side(-1).join(" L ")} L ${side(1).reverse().join(" L ")} Z" fill="${group.color}" fill-opacity=".85" stroke="#4e5551" stroke-width="1.1"/>`;
      }
      const dots = group.values.map((value,index)=>{
        // Stable jitter: changing view or resizing never reshuffles the points.
        const jitter = ((Math.imul(index+1,2654435761)^Math.imul(groupIndex+1,1597334677))>>>0)/4294967296-.5;
        return `<circle class="violin-point" cx="${(cx+jitter*half*1.35).toFixed(2)}" cy="${y(value).toFixed(2)}" r="1.25" fill="#161c18" opacity=".38"><title>${escape(group.name)} · ${escape(gene)}: ${value}</title></circle>`;
      }).join("");
      const labels = group.label.startsWith("Clone ") ? ["Clone",group.label.slice(6)] : group.label === "No TCR assigned" ? ["No TCR","assigned"] : group.label.split(" ");
      return `<g class="violin-group" data-group="${escape(group.name)}" data-count="${stat.n}"><title>${escape(group.name)}${group.sample?` · ${escape(group.sample)}`:""} · n=${stat.n} · median ${stat.median.toFixed(2)}</title>${shape}${dots}<line class="violin-median" x1="${cx-half*.6}" x2="${cx+half*.6}" y1="${y(stat.median)}" y2="${y(stat.median)}" stroke="#111" stroke-width="3"/><text x="${cx}" y="${bottom+23}" text-anchor="middle" class="violin-group-label">${labels.map((label,i)=>`<tspan x="${cx}" dy="${i?14:0}">${escape(label)}</tspan>`).join("")}</text><text x="${cx}" y="${bottom+65}" text-anchor="middle" class="violin-count">n=${stat.n}</text></g>`;
    }).join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escape(gene)} expression by ${groups.length} TCR groups" viewBox="0 0 ${width} ${height}" style="min-width:${width}px"><title>${escape(gene)} normalized RNA expression</title><desc>Each dot is a cell. Black horizontal marks show medians. All cells, including zeros, are included; violin widths are normalized separately.</desc>${ticks}${shapes}<path d="M ${margin.left},${margin.top} V ${bottom} H ${width-margin.right}" fill="none" stroke="#49564e" stroke-width="1"/><text transform="translate(15,${margin.top+plotHeight/2}) rotate(-90)" text-anchor="middle" class="violin-axis">Normalized expression</text></svg>`;
  }
  return {SIZE_ORDER,SIZE_COLORS,CLONE_COLORS,topClones,groups,summary,density,svg};
})();
