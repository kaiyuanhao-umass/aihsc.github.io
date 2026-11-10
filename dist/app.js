const DATASETS = {
  liver_broad: {
    path: "data/liver_broad.json",
    title: "All liver immune cells",
    description: "A broad view of the liver immune landscape.",
    denominator: "Composition among all recovered liver immune cells",
    colors: ["#71a7c4", "#8c72b8", "#66a96f", "#d5a23b", "#b18fc1", "#d87545", "#d76d88", "#4f9276", "#3f78b5"],
    paddingFactor: .09,
    labelStyle: "external",
    labelOffsets: {
      "Mono/Macrophages": [92, 8],
      "NK cells": [-52, -38],
      "Endothelial cells": [62, 34],
      "T cells": [-88, -12],
      "B cells": [-34, 55],
      "ILCs": [12, -56],
      "Dendritic cells": [76, -32],
      "Neutrophils": [22, -48],
      "Hepatocytes": [50, 34]
    },
    drilldown: {"Mono/Macrophages": "monomac", "T cells": "t_cells"},
    breadcrumb: []
  },
  monomac: {
    path: "data/monomac.json",
    title: "Monocytes & Macrophages",
    description: "High-resolution monocyte and macrophage populations.",
    denominator: "Composition among recovered monocytes and macrophages",
    colors: ["#cf7a4e", "#6b9166", "#7296bd", "#ba6c7c", "#ab8958", "#8a74a8"],
    paddingFactor: .17,
    labelStyle: "external",
    labelFontSize: 12.5,
    labelOffsets: {
      "SLAMF9+ Macrophages": [0, -76],
      "Kupffer cells": [82, 52],
      "Trans.Monocytes": [-90, -22],
      "Classical Monocytes": [-60, 38],
      "Patrol.Monocytes": [-62, -38],
      "Trans.Macrophages": [104, 22]
    },
    drilldown: {}, breadcrumb: ["Monocytes & Macrophages"]
  },
  t_cells: {
    path: "data/t_cells.json?v=20261110-20",
    title: "T-cell expression atlas",
    description: "CD4, CD8, regulatory, proliferating, and γδ T-cell states.",
    denominator: "Composition among recovered T cells",
    // Manuscript palette from DKO T cells.R, in fixture annotation order.
    colors: ["#dc7369", "#5E9789", "#dad4b9", "#78B7D9", "#9DCAF1", "#C8CDCF", "#446E9C", "#CBE0F0", "#CDB6DA", "#6FB3A2"],
    labelStyle: "external",
    avoidPointOverlap: true,
    labelLines: {
      "Activated CD8+ T cells": ["Activated CD8⁺", "T cells"],
      "ITGA1+ CD4+ T cells": ["Activated CD4⁺", "T cells I"],
      "CD40LG+ CD4+ T cells": ["Activated CD4⁺", "T cells II"],
      "Proliferating T cells": ["Proliferating", "T cells"]
    },
    labelOffsets: {
      "Activated CD8+ T cells": [-65, 25],
      "RORg+ gd T cells": [8, 54],
      "Naive CD8+ T cells": [18, -48],
      "ITGA1+ CD4+ T cells": [-70, -12],
      "CD40LG+ CD4+ T cells": [26, 36],
      "CD8aa IELs": [-55, -42],
      "Treg": [4, 50],
      "Naive CD4+ T cells": [76, -4],
      "Proliferating T cells": [58, -48],
      "Naive gd T cells": [-12, -42]
    },
    drilldown: {"Activated CD8+ T cells": "cd8_activated"},
    breadcrumb: ["T cells"]
  },
  cd8_activated: {
    path: "data/cd8_activated.json",
    title: "Activated CD8 T cells",
    description: "Stem-like, intermediate, effector, terminal, and tissue-resident memory-like activated states.",
    denominator: "Composition among recovered activated CD8 T cells",
    colors: ["#f0cd9b", "#71a672", "#b5af78", "#7ea4b8", "#d19243"],
    subsetOrder: ["Stem-like", "Intermediate", "Terminal", "Trm", "Teff"],
    legend: [
      ["Teff", "Short-lived effector cells"],
      ["Stem-like", "Stem cell-like memory"],
      ["Intermediate", "Intermediate"],
      ["Terminal", "Terminal-differentiated"],
      ["Trm", "Tissue-resident memory cells"]
    ],
    paddingFactor: .18,
    labelStyle: "external",
    labelFontSize: 20,
    labelOffsetReferenceWidth: 600,
    labelOffsets: {
      "Trm": [78, 6],
      "Intermediate": [116, -24],
      "Terminal": [-42, -50],
      "Teff": [-60, 24],
      "Stem-like": [-88, 6]
    },
    drilldown: {}, breadcrumb: ["T cells", "Activated CD8 T cells"]
  }
};

const DISPLAY_LABELS = {
  "Mono/Macrophages": "Monocytes & Macrophages",
  "ILCs": "Others",
  "Activated CD8+ T cells": "Activated CD8⁺ T cells",
  "CD40LG+ CD4+ T cells": "Activated CD4⁺ T cells II",
  "ITGA1+ CD4+ T cells": "Activated CD4⁺ T cells I",
  "Naive CD4+ T cells": "Naive CD4 T cells",
  "Naive CD8+ T cells": "Naive CD8 T cells",
  "RORg+ gd T cells": "RORγt⁺ γδ T cells",
  "Naive gd T cells": "Naive γδ T cells",
  "CD8aa IELs": "CD8αα IELs",
  "SLAMF9+ Macrophages": "MoMacs",
  "Stem-like": "TSCM",
  "Intermediate": "TINT",
  "Terminal": "TTER",
  "Trm": "TRM",
  "Teff": "TSLEC"
};

const TCR_EXPLORERS = {
  tcr_total: {dataset: "t_cells", title: "Total T-cell TCR", label: "Total T-cell subsets", description: "Connect all liver T-cell states, clonal expansion, and gene expression across pooled Control and AIH cells."},
  tcr: {dataset: "cd8_activated", title: "Activated CD8 T-cell TCR", label: "Activated CD8 T-cell subsets", description: "Connect activated CD8 cell states, clonal expansion, and gene expression across pooled Control and AIH cells."}
};

const DISPLAY_LABEL_PARTS = {
  "Stem-like": ["T", "SCM"],
  "Intermediate": ["T", "INT"],
  "Terminal": ["T", "TER"],
  "Trm": ["T", "RM"],
  "Teff": ["T", "SLEC"]
};

const CONDITION_LABELS = {all: "Combined", HET: "Control (Het)", DKO: "AIH model (DKO)"};
const CONDITION_INDEX = {HET: 0, DKO: 1};
const CONDITION_COLORS = {HET: "#7599b5", DKO: "#b75b49"};
const GENE_GRADIENT = ["#e5e5e5", "#b21111"];
const FEATURE_ORDER_BY_EXPRESSION = false;
const EXPANSION_COLORS = TcrExpression.SIZE_COLORS;
const CLONE_COLORS = TcrExpression.CLONE_COLORS;
const cache = new Map();
const annotationLayouts = new WeakMap();
const plots = [];

let currentDatasetId = "liver_broad";
let currentData = null;
let currentGene = "Ptprc";
let exploreCondition = "all";
let overviewCondition = "all";
let overviewMode = "annotation";
let overviewGene = "Ptprc";
let panelGenes = [];
let panelTab = "features";
let overlayPrimary = null;
let tcrGene = "Gzmk";
let tcrMode = "expansion";
let tcrShowPoints = true;

function displayLabel(value) { return DISPLAY_LABELS[value] || value; }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c])); }
function displayLabelHtml(value) { const parts=DISPLAY_LABEL_PARTS[value]; return parts?`${escapeHtml(parts[0])}<sub>${escapeHtml(parts[1])}</sub>`:escapeHtml(displayLabel(value)); }
function conditionMatches(row, condition) { return condition === "all" || row[3] === CONDITION_INDEX[condition]; }
function comma(value) { return Number(value).toLocaleString(); }
function scaleLabel(value) { return value >= 10 ? value.toFixed(0) : value >= 1 ? value.toFixed(1) : value.toFixed(2); }

function hexToRgb(hex) {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function gradientColor(value, max) {
  if (!value || !max) return GENE_GRADIENT[0];
  const scaled = Math.min(1, value / max) * (GENE_GRADIENT.length - 1);
  const index = Math.min(GENE_GRADIENT.length - 2, Math.floor(scaled));
  const fraction = scaled - index;
  const a = hexToRgb(GENE_GRADIENT[index]);
  const b = hexToRgb(GENE_GRADIENT[index + 1]);
  return `rgb(${a.map((channel, i) => Math.round(channel + (b[i] - channel) * fraction)).join(",")})`;
}

function percentile(values, q = .98) {
  const nonzero = values.filter(value => value > 0).sort((a,b) => a-b);
  if (!nonzero.length) return 1;
  return nonzero[Math.min(nonzero.length - 1, Math.floor(nonzero.length * q))] || 1;
}

async function loadDataset(id) {
  if (!cache.has(id)) {
    cache.set(id, fetch(DATASETS[id].path).then(response => {
      if (!response.ok) throw new Error(`Unable to load ${DATASETS[id].title}`);
      return response.json();
    }).then(data => {
      data.geneIndex = Object.fromEntries(data.genes.map((gene, index) => [gene, 6 + index]));
      return data;
    }));
  }
  return cache.get(id);
}

// Search white space using an integral occupancy grid: each candidate checks
// every dot's footprint in constant time, including a gap around the points.
function pointFreeLabelLayout(labels, points, width, height, radius) {
  const step=2, cols=Math.ceil(width/step)+1, rows=Math.ceil(height/step)+1;
  const occupied=new Uint8Array(cols*rows), summed=new Uint32Array(cols*rows);
  for(const point of points) {
    const gap=radius+4;
    const left=Math.max(0,Math.floor((point.x-gap)/step)), right=Math.min(cols-1,Math.ceil((point.x+gap)/step));
    const top=Math.max(0,Math.floor((point.y-gap)/step)), bottom=Math.min(rows-1,Math.ceil((point.y+gap)/step));
    for(let y=top;y<=bottom;y++) for(let x=left;x<=right;x++) occupied[y*cols+x]=1;
  }
  for(let y=1;y<rows;y++) for(let x=1;x<cols;x++) {
    const i=y*cols+x; summed[i]=occupied[i]+summed[i-1]+summed[i-cols]-summed[i-cols-1];
  }
  const clear=box=>{
    const l=Math.floor(box.x/step)-1, r=Math.ceil((box.x+box.width)/step);
    const t=Math.floor(box.y/step)-1, b=Math.ceil((box.y+box.height)/step);
    return summed[b*cols+r]-summed[t*cols+r]-summed[b*cols+l]+summed[t*cols+l]===0;
  };
  const separate=(a,b)=>a.x+a.width+5<=b.x || b.x+b.width+5<=a.x || a.y+a.height+5<=b.y || b.y+b.height+5<=a.y;
  const choices=labels.map(label=>{
    const candidates=[];
    for(let y=8;y+label.height<=height-25;y+=4) for(let x=20;x+label.width<=width-8;x+=4) {
      const box={x,y,width:label.width,height:label.height,index:label.index};
      if(!clear(box)) continue;
      const cx=x+label.width/2, cy=y+label.height/2;
      const dx=Math.max(0,Math.abs(cx-label.baseX)-label.width/2), dy=Math.max(0,Math.abs(cy-label.baseY)-label.height/2);
      box.score=dx*dx+dy*dy+.35*((cx-label.preferredX)**2+(cy-label.preferredY)**2);
      candidates.push(box);
    }
    candidates.sort((a,b)=>a.score-b.score);
    return {label,candidates};
  });
  // Place labels with the fewest available positions first. Retry a different
  // order before requesting more margin; never accept an overlapping label.
  for(const order of [choices.slice().sort((a,b)=>a.candidates.length-b.candidates.length),choices.slice().sort((a,b)=>b.label.width*b.label.height-a.label.width*a.label.height)]) {
    const placed=[];
    for(const {candidates} of order) {
      const box=candidates.find(candidate=>placed.every(other=>separate(candidate,other)));
      if(!box) break;
      placed.push(box);
    }
    if(placed.length===labels.length) return new Map(placed.map(box=>[box.index,box]));
  }
  return null;
}

class UmapPlot {
  constructor(canvas, tooltip = null) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.tooltip = tooltip;
    this.data = null;
    this.options = {};
    this.labelBoxes = [];
    this.canvas.addEventListener("mousemove", event => this.pointerMove(event));
    this.canvas.addEventListener("mouseleave", () => { if (this.tooltip) this.tooltip.hidden = true; this.canvas.style.cursor = "default"; });
    this.canvas.addEventListener("click", event => this.pointerClick(event));
    plots.push(this);
  }

  set(data, options = {}) { this.data = data; this.options = options; this.render(); }

  size() {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(rect.width * ratio);
    this.canvas.height = Math.round(rect.height * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return rect;
  }

  transform(rect) {
    const xs = this.data.cells.map(row => row[0]);
    const ys = this.data.cells.map(row => row[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const config=DATASETS[this.data.id];
    const makeTransform=padding=>{
      const pad=Math.min(rect.width,rect.height)*padding;
      const scale=Math.min((rect.width-pad*2)/Math.max(.001,maxX-minX),(rect.height-pad*2)/Math.max(.001,maxY-minY));
      const plotW=(maxX-minX)*scale, plotH=(maxY-minY)*scale;
      const ox=(rect.width-plotW)/2, oy=(rect.height-plotH)/2;
      return {x:value=>ox+(value-minX)*scale,y:value=>rect.height-(oy+(value-minY)*scale)};
    };
    if(!config.avoidPointOverlap || ((this.options.mode||"annotation")!=="annotation" && !this.options.matchAnnotationLayout)) return makeTransform(config.paddingFactor??.09);
    const metrics=this.labelMetrics(config);
    const key=JSON.stringify([rect.width,rect.height,metrics.map(label=>[label.width,label.height])]);
    const cached=annotationLayouts.get(this.data)?.get(key);
    if(cached) {
      this.pointFreeLabels=cached.labels; return cached.transform;
    }
    // Use all cells for a stable layout across conditions and paired panels.
    // Only uniform scale and translation change; frozen coordinates stay intact.
    for(let padding=.12;padding<=.4001;padding+=.02) {
      const tr=makeTransform(padding);
      const labels=metrics.map(label=>{
        const offset=config.labelOffsets?.[label.annotation.name]||[0,0];
        return {...label,baseX:tr.x(label.annotation.x),baseY:tr.y(label.annotation.y),preferredX:tr.x(label.annotation.x)+offset[0],preferredY:tr.y(label.annotation.y)+offset[1]};
      });
      const layout=pointFreeLabelLayout(labels,this.data.cells.map(row=>({x:tr.x(row[0]),y:tr.y(row[1])})),rect.width,rect.height,1.25);
      if(layout) {
        this.pointFreeLabels=layout;
        if(!annotationLayouts.has(this.data)) annotationLayouts.set(this.data,new Map());
        annotationLayouts.get(this.data).set(key,{labels:layout,transform:tr});
        return tr;
      }
    }
    // A minimum plot height in CSS keeps even narrow phone panels readable.
    throw new Error("The T-cell plot needs more space for its labels.");
  }

  render() {
    if (!this.data || !this.canvas.isConnected) return;
    const rect = this.size(); if (!rect) return;
    const ctx = this.ctx; ctx.clearRect(0,0,rect.width,rect.height);
    const tr = this.transform(rect); this.tr = tr; this.labelBoxes=[];
    const condition = this.options.condition || "all";
    const visible = this.data.cells.filter(row => conditionMatches(row, condition));
    this.visible = visible;
    const mode = this.options.mode || "annotation";
    const config = DATASETS[this.data.id];
    let geneIndex, geneMax = 1;
    if (mode === "gene") {
      geneIndex = this.data.geneIndex[this.options.gene];
      geneMax = percentile(this.data.cells.map(row => row[geneIndex]));
    }
    const radius = (this.data.total_cells > 50000 ? 1.05 : this.data.total_cells > 18000 ? 1.25 : this.data.total_cells > 6000 ? 1.55 : 2.0) * (this.options.pointScale || 1);
    const cloneMap = this.options.cloneMap || new Map();
    const drawRows = mode === "clones" ? [...visible.filter(row=>!cloneMap.has(row[5])),...visible.filter(row=>cloneMap.has(row[5]))] : mode === "gene" && FEATURE_ORDER_BY_EXPRESSION ? [...visible].sort((a,b) => a[geneIndex] - b[geneIndex]) : visible;
    for (const row of drawRows) {
      let color = "#bfc6c0", alpha=.78;
      if (mode === "annotation") color = config.colors[row[2] % config.colors.length];
      if (mode === "gene") { color = gradientColor(row[geneIndex], geneMax); alpha = row[geneIndex] > 0 ? .88 : .34; }
      if (mode === "expansion") color = EXPANSION_COLORS[this.data.expansion_levels[row[4]]] || "#d9ddd9";
      if (mode === "clones") { color = cloneMap.has(row[5]) ? cloneMap.get(row[5]) : "#d9ddd9"; alpha = cloneMap.has(row[5]) ? .9 : .36; }
      if (mode === "overlay") {
        const a = row[this.data.geneIndex[this.options.genes[0]]];
        const b = row[this.data.geneIndex[this.options.genes[1]]];
        color = a > 0 && b > 0 ? "#7446a3" : a > 0 ? "#c64d5f" : b > 0 ? "#347fac" : "#dfe3df";
        alpha = a > 0 || b > 0 ? .9 : .35;
      }
      ctx.beginPath(); ctx.arc(tr.x(row[0]), tr.y(row[1]), radius, 0, Math.PI*2); ctx.fillStyle=color; ctx.globalAlpha=alpha; ctx.fill();
    }
    ctx.globalAlpha=1;
    if (mode === "annotation" && this.options.labels !== false) this.drawLabels(visible, tr, config);
  }

  labelMetrics(config) {
    return this.data.annotations.map((annotation,index)=>{
      const label = displayLabel(annotation.name); const labelParts=DISPLAY_LABEL_PARTS[annotation.name];
      const maxLabelLength=config.labelStyle==="external"?18:24;
      const words = label.split(" "); const lines=[]; let line="";
      words.forEach(word => { const next=(line+" "+word).trim(); if(next.length>maxLabelLength && line){lines.push(line);line=word;}else line=next; }); if(line) lines.push(line);
      if(config.labelLines?.[annotation.name]) lines.splice(0,lines.length,...config.labelLines[annotation.name]);
      const fontSize=config.labelFontSize ?? (config.labelStyle==="external"?(this.data.total_cells>20000?14:15):(this.data.total_cells>20000?10.5:11.5));
      const fontFamily=getComputedStyle(document.body).fontFamily;
      this.ctx.font=`700 ${fontSize}px ${fontFamily}`;
      this.ctx.textAlign="center"; this.ctx.textBaseline="middle";
      let richWidth=0;
      if(labelParts){this.ctx.font=`700 ${fontSize}px ${fontFamily}`;richWidth=this.ctx.measureText(labelParts[0]).width;this.ctx.font=`700 ${fontSize*.7}px ${fontFamily}`;richWidth+=this.ctx.measureText(labelParts[1]).width;this.ctx.font=`700 ${fontSize}px ${fontFamily}`;}
      const width=(labelParts?richWidth:Math.max(...lines.map(value=>this.ctx.measureText(value).width)))+12; const height=(labelParts?fontSize+4:lines.length*(fontSize+2))+8;
      return {annotation,index,lines,labelParts,fontSize,fontFamily,richWidth,width,height};
    });
  }

  drawLabels(visible, tr, config) {
    const counts = new Map(); visible.forEach(row => counts.set(row[2], (counts.get(row[2])||0)+1));
    this.labelMetrics(config).forEach(({annotation,index,lines,labelParts,fontSize,fontFamily,richWidth,width,height}) => {
      if (!counts.get(index)) return;
      const baseX=tr.x(annotation.x), baseY=tr.y(annotation.y);
      const offset=config.labelOffsets?.[annotation.name] || [0,0];
      const offsetScale=config.labelOffsetReferenceWidth?this.canvas.clientWidth/config.labelOffsetReferenceWidth:1;
      let x=baseX+offset[0]*offsetScale, y=baseY+offset[1]*offsetScale;
      this.ctx.font=`700 ${fontSize}px ${fontFamily}`;
      this.ctx.textAlign="center"; this.ctx.textBaseline="middle";
      x=Math.max(width/2+5,Math.min(this.canvas.clientWidth-width/2-5,x));
      y=Math.max(height/2+5,Math.min(this.canvas.clientHeight-height/2-5,y));
      if(config.avoidPointOverlap) {
        const box=this.pointFreeLabels.get(index); x=box.x+box.width/2; y=box.y+box.height/2;
      } else if(this.options.avoidLabelOverlap) {
        const clamp=(px,py)=>({x:Math.max(width/2+20,Math.min(this.canvas.clientWidth-width/2-8,px)),y:Math.max(height/2+8,Math.min(this.canvas.clientHeight-height/2-25,py))});
        const fits=point=>this.labelBoxes.every(box=>point.x+width/2+4<=box.x || point.x-width/2-4>=box.x+box.width || point.y+height/2+4<=box.y || point.y-height/2-4>=box.y+box.height);
        let position=clamp(x,y);
        search: for(let distance=0;distance<=Math.max(this.canvas.clientWidth,this.canvas.clientHeight);distance+=6) {
          for(const [dx,dy] of [[0,-1],[0,1],[-1,0],[1,0],[-.707,-.707],[.707,-.707],[-.707,.707],[.707,.707]]) {
            const candidate=clamp(x+dx*distance,y+dy*distance);
            if(fits(candidate)){position=candidate;break search;}
          }
        }
        x=position.x;y=position.y;
      }
      const labelColor=config.colors[index % config.colors.length];
      if(config.labelStyle==="external" && (offset[0] || offset[1])) {
        const endX=Math.max(x-width/2,Math.min(x+width/2,baseX)), endY=Math.max(y-height/2,Math.min(y+height/2,baseY));
        this.ctx.beginPath(); this.ctx.moveTo(baseX,baseY); this.ctx.lineTo(endX,endY); this.ctx.strokeStyle=labelColor; this.ctx.globalAlpha=.7; this.ctx.lineWidth=1.2; this.ctx.stroke(); this.ctx.globalAlpha=1;
      }
      this.ctx.strokeStyle="rgba(255,255,255,.96)"; this.ctx.lineWidth=config.labelStyle==="external"?3.5:5;
      if(labelParts){
        const main=labelParts[0], suffix=labelParts[1], start=x-richWidth/2;
        this.ctx.textAlign="left";this.ctx.font=`700 ${fontSize}px ${fontFamily}`;this.ctx.strokeText(main,start,y);this.ctx.fillStyle=config.labelStyle==="external"?labelColor:"#183027";this.ctx.fillText(main,start,y);
        const mainWidth=this.ctx.measureText(main).width;this.ctx.font=`700 ${fontSize*.7}px ${fontFamily}`;this.ctx.strokeText(suffix,start+mainWidth,y+fontSize*.24);this.ctx.fillText(suffix,start+mainWidth,y+fontSize*.24);this.ctx.textAlign="center";this.ctx.font=`700 ${fontSize}px ${fontFamily}`;
      } else lines.forEach((value,lineIndex)=>{const ly=y+(lineIndex-(lines.length-1)/2)*(fontSize+2);this.ctx.strokeText(value,x,ly);this.ctx.fillStyle=config.labelStyle==="external"?labelColor:"#183027";this.ctx.fillText(value,x,ly);});
      this.labelBoxes.push({x:x-width/2,y:y-height/2,width,height,index,name:annotation.name,clickable:Boolean(config.drilldown[annotation.name] && this.options.onLabelClick),count:counts.get(index)});
    });
  }

  pointerPosition(event) { const rect=this.canvas.getBoundingClientRect(); return {x:event.clientX-rect.left,y:event.clientY-rect.top}; }
  hitLabel(event) { const p=this.pointerPosition(event); return this.labelBoxes.find(box=>p.x>=box.x&&p.x<=box.x+box.width&&p.y>=box.y&&p.y<=box.y+box.height); }
  pointerMove(event) {
    const hit=this.hitLabel(event); this.canvas.style.cursor=hit?.clickable?"pointer":"default";
    if (!this.tooltip) return;
    if (!hit) {this.tooltip.hidden=true;return;}
    this.tooltip.hidden=false; this.tooltip.style.left=`${Math.max(8,Math.min(this.canvas.clientWidth-175,hit.x+hit.width+8))}px`; this.tooltip.style.top=`${Math.max(8,hit.y-4)}px`;
    this.tooltip.innerHTML=`<strong>${displayLabelHtml(hit.name)}</strong><span>${comma(hit.count)} displayed cells</span>${hit.clickable?"<span>Open high-resolution explorer →</span>":""}`;
  }
  pointerClick(event) { const hit=this.hitLabel(event); if(hit?.clickable && this.options.onLabelClick) this.options.onLabelClick(hit.name); }
}

window.addEventListener("resize", () => requestAnimationFrame(() => plots.forEach(plot => plot.render())));

const overviewPlot = new UmapPlot(document.querySelector("#overview-canvas"), document.querySelector("#overview-tooltip"));
const annotationPlot = new UmapPlot(document.querySelector("#annotation-canvas"), document.querySelector("#annotation-tooltip"));
const featurePlot = new UmapPlot(document.querySelector("#feature-canvas"), document.querySelector("#feature-tooltip"));
const tcrPlot = new UmapPlot(document.querySelector("#tcr-canvas"), document.querySelector("#tcr-tooltip"));
const tcrReferencePlot = new UmapPlot(document.querySelector("#tcr-reference-canvas"));

function showView(name, scroll = true) {
  document.querySelectorAll(".page-view").forEach(view => view.classList.toggle("active", view.dataset.view === name));
  document.querySelectorAll("[data-view-link]").forEach(button => button.classList.toggle("active", button.dataset.viewLink === name));
  if (scroll) window.scrollTo({top:0,behavior:"smooth"});
  history.replaceState(null,"",`#${name}`);
  const mobile=document.querySelector("#mobile-nav"); mobile.hidden=true; document.querySelector("#mobile-menu-button").setAttribute("aria-expanded","false");
  setTimeout(()=>plots.forEach(plot=>plot.render()),30);
}

async function goDataset(id) {
  document.querySelectorAll(".explore-menu").forEach(menu => menu.open=false);
  showView("explore");
  currentDatasetId=id;
  document.querySelector("#dataset-select").value=id;
  if(TCR_EXPLORERS[id]) await renderTcrExplorer(id); else await renderExpressionExplorer(id,true);
}

document.querySelectorAll("[data-view-link]").forEach(button=>button.addEventListener("click",()=>showView(button.dataset.viewLink)));
document.querySelectorAll("[data-dataset-link]").forEach(button=>button.addEventListener("click",()=>goDataset(button.dataset.datasetLink)));
document.querySelector("#dataset-select").addEventListener("change",event=>goDataset(event.target.value));
document.querySelector("#mobile-menu-button").addEventListener("click",event=>{const nav=document.querySelector("#mobile-nav");nav.hidden=!nav.hidden;event.currentTarget.setAttribute("aria-expanded",String(!nav.hidden));});

function fillGeneLists(data) {
  const options=data.genes.map(gene=>`<option value="${escapeHtml(gene)}"></option>`).join("");
  ["#explore-genes","#panel-genes"].forEach(id=>document.querySelector(id).innerHTML=options);
}

function validGene(data,value) { return data.genes.find(gene=>gene.toLowerCase()===String(value).trim().toLowerCase()) || null; }
function labelClick(name) { const target=DATASETS[currentDatasetId].drilldown[name]; if(target) goDataset(target); }

async function renderExpressionExplorer(id, resetGene=false) {
  const data=await loadDataset(id); if(currentDatasetId!==id)return;
  currentData=data; const meta=DATASETS[id];
  document.querySelector("#expression-workspace").hidden=false; document.querySelector("#tcr-workspace").hidden=true;
  document.querySelector("#explore-title").textContent=meta.title; document.querySelector("#explore-description").textContent=meta.description;
  document.querySelector("#explore-tcr-button").hidden=!["t_cells","cd8_activated"].includes(id);
  document.querySelector("#explore-tcr-button").dataset.datasetLink=id==="t_cells"?"tcr_total":"tcr";
  document.querySelector("#tcr-expression-button").hidden=true;
  document.querySelector("#breadcrumb-tail").textContent=meta.breadcrumb.length?`› ${meta.breadcrumb.join(" › ")}`:"";
  if(resetGene || !currentData.genes.includes(currentGene)) currentGene=currentData.default_gene;
  document.querySelector("#explore-gene").value=currentGene; fillGeneLists(currentData);
  closeAdvancedViews(); renderSingleGene();
}

function closeAdvancedViews() {
  document.querySelector("#single-gene-view").hidden=false; document.querySelector("#gene-panel-view").hidden=true; document.querySelector("#overlay-view").hidden=true;
}

function renderSingleGene() {
  if(!currentData) return; const meta=DATASETS[currentDatasetId];
  document.querySelector("#single-gene-view").classList.toggle("t-cell-plots",currentDatasetId==="t_cells");
  const legend=document.querySelector("#annotation-legend");
  legend.hidden=!meta.legend;
  legend.closest(".paired-plots").classList.toggle("with-subset-legend",Boolean(meta.legend));
  legend.innerHTML=(meta.legend||[]).map(([name,description])=>{
    const index=currentData.annotations.findIndex(annotation=>annotation.name===name);
    return `<li><i aria-hidden="true" style="background:${meta.colors[index]}"></i><span>${escapeHtml(description)} (${displayLabelHtml(name)})</span></li>`;
  }).join("");
  annotationPlot.set(currentData,{mode:"annotation",condition:exploreCondition,onLabelClick:labelClick});
  featurePlot.set(currentData,{mode:"gene",gene:currentGene,condition:exploreCondition,matchAnnotationLayout:true});
  const visible=currentData.cells.filter(row=>conditionMatches(row,exploreCondition)).length;
  document.querySelector("#annotation-count").textContent=`${comma(visible)} cells`;
  document.querySelector("#feature-title").textContent=currentGene;
  document.querySelector("#feature-condition").textContent=CONDITION_LABELS[exploreCondition];
  document.querySelector("#feature-scale-high").textContent=scaleLabel(percentile(currentData.cells.map(row=>row[currentData.geneIndex[currentGene]])));
  document.querySelector("#expression-summary-title").textContent=`${currentGene} by population and condition`;
  const hasDrilldown=Object.keys(meta.drilldown).length>0;
  document.querySelector("#drilldown-note").textContent=hasDrilldown?"Select a labeled population to open its available high-resolution explorer.":"Population names are shown directly on the UMAP.";
  renderExpressionSummary();
}

document.querySelector("#explore-show-gene").addEventListener("click",()=>{const gene=validGene(currentData,document.querySelector("#explore-gene").value);if(!gene){document.querySelector("#explore-gene").setCustomValidity("Choose a gene available in this review build.");document.querySelector("#explore-gene").reportValidity();return;}document.querySelector("#explore-gene").setCustomValidity("");currentGene=gene;renderSingleGene();});
document.querySelector("#explore-gene").addEventListener("keydown",event=>{if(event.key==="Enter")document.querySelector("#explore-show-gene").click();});

document.querySelectorAll("[data-condition-group]").forEach(group=>group.addEventListener("click",event=>{
  const button=event.target.closest("[data-condition]"); if(!button)return;
  group.querySelectorAll("[data-condition]").forEach(item=>item.classList.toggle("selected",item===button));
  const condition=button.dataset.condition;
  if(group.dataset.conditionGroup==="overview"){overviewCondition=condition;renderOverviewPlot();}
  if(group.dataset.conditionGroup==="explore"){exploreCondition=condition;if(!document.querySelector("#overlay-view").hidden)renderOverlay();else if(!document.querySelector("#gene-panel-view").hidden)renderGenePanel();else renderSingleGene();}
}));

function expressionStats(gene, condition=null) {
  const index=currentData.geneIndex[gene];
  return currentData.annotations.map((annotation,annotationIndex)=>{
    const rows=currentData.cells.filter(row=>row[2]===annotationIndex && (!condition||conditionMatches(row,condition)));
    const sum=rows.reduce((total,row)=>total+row[index],0); const positive=rows.filter(row=>row[index]>0).length; const mean=rows.length?sum/rows.length:0;
    const squared=rows.reduce((total,row)=>total+(row[index]-mean)**2,0); const sem=rows.length>1?Math.sqrt(squared/(rows.length-1))/Math.sqrt(rows.length):0;
    return {name:displayLabel(annotation.name),rawName:annotation.name,mean,sem,percent:rows.length?positive/rows.length*100:0};
  });
}

function renderExpressionSummary() {
  const control=expressionStats(currentGene,"HET"), aih=expressionStats(currentGene,"DKO");
  const subsetOrder=DATASETS[currentDatasetId]?.subsetOrder;
  if(subsetOrder) {
    const rank=name=>{const index=subsetOrder.indexOf(name);return index<0?subsetOrder.length:index;};
    [control,aih].forEach(items=>items.sort((a,b)=>rank(a.rawName)-rank(b.rawName)));
  }
  const maxMean=Math.max(.001,...control.map(x=>x.mean+x.sem),...aih.map(x=>x.mean+x.sem));
  const renderEntry=(item,key,max,group,withError)=>{const value=item[key];const width=Math.min(100,value/max*100);const errorLeft=Math.max(0,(value-(withError?item.sem:0))/max*100);const errorWidth=withError?Math.min(100-errorLeft,item.sem*2/max*100):0;const valueLeft=Math.min(100,withError?(value+item.sem)/max*100:width);const label=key==="mean"?value.toFixed(2):value.toFixed(0)+"%";return `<div class="metric-entry"><div class="metric-line ${group}" style="--bar-width:${width}%;--error-left:${errorLeft}%;--error-width:${errorWidth}%;--value-left:${valueLeft}%"><i></i>${withError?'<b class="metric-error" aria-hidden="true"></b>':""}<small class="metric-value">${label}</small></div></div>`;};
  const renderMetric=(key,max,withError=false)=>control.map((item,index)=>{const subsetLabel=item.name==="Monocytes & Macrophages"?"Monocytes &amp;<br>Macrophages":displayLabelHtml(item.rawName);return `<div class="metric-row" title="${escapeHtml(item.name)}"><span>${subsetLabel}</span><div class="metric-track">${renderEntry(item,key,max,"control",withError)}${renderEntry(aih[index],key,max,"aih",withError)}</div></div>`;}).join("");
  document.querySelector("#mean-expression-bars").innerHTML=renderMetric("mean",maxMean,true);
  document.querySelector("#percent-expression-bars").innerHTML=renderMetric("percent",100);
}

async function initOverview() {
  const data=await loadDataset("liver_broad"); const options=data.genes.map(gene=>`<option value="${gene}"></option>`).join(""); document.querySelector("#overview-genes").innerHTML=options; renderOverviewPlot();
}
function renderOverviewPlot() { document.querySelector("#overview-show-annotations").textContent=overviewMode==="gene"?"Return to Subset Annotation":"Subset Annotation";loadDataset("liver_broad").then(data=>{const scale=document.querySelector("#overview-expression-scale");scale.hidden=overviewMode!=="gene";if(overviewMode==="gene")document.querySelector("#overview-scale-high").textContent=scaleLabel(percentile(data.cells.map(row=>row[data.geneIndex[overviewGene]])));overviewPlot.set(data,{mode:overviewMode,gene:overviewGene,condition:overviewCondition,onLabelClick:name=>{const target=DATASETS.liver_broad.drilldown[name];if(target)goDataset(target);}});}); }
document.querySelector("#overview-show-gene").addEventListener("click",async()=>{const data=await loadDataset("liver_broad");const gene=validGene(data,document.querySelector("#overview-gene").value);if(!gene){document.querySelector("#overview-gene").setCustomValidity("Choose a gene available in this review build.");document.querySelector("#overview-gene").reportValidity();return;}document.querySelector("#overview-gene").setCustomValidity("");overviewGene=gene;overviewMode="gene";document.querySelector("#overview-help").innerHTML=`Showing normalized <strong>${escapeHtml(gene)}</strong> expression. Use “Return to Subset Annotation” to restore annotated drill-down.`;renderOverviewPlot();});
document.querySelector("#overview-gene").addEventListener("keydown",event=>{if(event.key==="Enter")document.querySelector("#overview-show-gene").click();});
document.querySelector("#overview-show-annotations").addEventListener("click",()=>{overviewMode="annotation";document.querySelector("#overview-help").innerHTML="Population names are shown directly. Select <strong>Monocytes &amp; Macrophages</strong> or <strong>T cells</strong> to open the corresponding high-resolution explorer.";renderOverviewPlot();});

document.querySelector("#open-gene-panel").addEventListener("click",()=>{panelGenes=[currentGene];panelTab="features";document.querySelector("#single-gene-view").hidden=true;document.querySelector("#overlay-view").hidden=true;document.querySelector("#gene-panel-view").hidden=false;renderGenePanel();});
document.querySelector("#close-gene-panel").addEventListener("click",closeAdvancedViews);
document.querySelector("#add-panel-gene").addEventListener("click",()=>{const input=document.querySelector("#panel-gene-input");const gene=validGene(currentData,input.value);if(!gene||panelGenes.includes(gene)||panelGenes.length>=6)return;panelGenes.push(gene);input.value="";renderGenePanel();});
document.querySelector("#panel-gene-input").addEventListener("keydown",event=>{if(event.key==="Enter")document.querySelector("#add-panel-gene").click();});
document.querySelectorAll("[data-panel-tab]").forEach(button=>button.addEventListener("click",()=>{panelTab=button.dataset.panelTab;document.querySelectorAll("[data-panel-tab]").forEach(item=>item.classList.toggle("selected",item===button));renderGenePanel();}));

function renderGenePanel() {
  document.querySelector("#gene-chips").innerHTML=panelGenes.map(gene=>`<span class="gene-chip">${escapeHtml(gene)}<button type="button" data-remove-gene="${escapeHtml(gene)}" aria-label="Remove ${escapeHtml(gene)}">×</button></span>`).join("");
  document.querySelectorAll("[data-remove-gene]").forEach(button=>button.addEventListener("click",()=>{panelGenes=panelGenes.filter(gene=>gene!==button.dataset.removeGene);renderGenePanel();}));
  const content=document.querySelector("#panel-content");
  if(!panelGenes.length){content.innerHTML="<p class='plot-note'>Add a gene to begin.</p>";return;}
  if(panelTab==="features") {
    content.innerHTML=`<div class="feature-grid">${panelGenes.map(gene=>`<article class="gene-tile" data-overlay-gene="${escapeHtml(gene)}"><header><strong>${escapeHtml(gene)}</strong><span>${panelGenes.length>1?"Select to overlap":"FeaturePlot"}</span></header><canvas aria-label="${escapeHtml(gene)} FeaturePlot"></canvas></article>`).join("")}</div>`;
    content.querySelectorAll(".gene-tile").forEach(tile=>{new UmapPlot(tile.querySelector("canvas")).set(currentData,{mode:"gene",gene:tile.dataset.overlayGene,condition:exploreCondition});tile.addEventListener("click",()=>{if(panelGenes.length>1)openOverlay(tile.dataset.overlayGene);});});
  }
  if(panelTab==="dotplot") renderDotplot(content);
  if(panelTab==="heatmap") renderHeatmap(content);
}

function panelStats() {
  return panelGenes.map(gene=>({gene,stats:expressionStats(gene,exploreCondition==="all"?null:exploreCondition)}));
}
function renderDotplot(content) {
  const stats=panelStats(), cols=currentData.annotations.length; const means=stats.flatMap(row=>row.stats.map(x=>x.mean)); const max=Math.max(.001,...means);
  const headers=currentData.annotations.map(a=>`<div class="dot-col-label">${displayLabelHtml(a.name)}</div>`).join("");
  const rows=stats.map(row=>`<div class="dot-row" style="--cols:${cols}"><div class="dot-label">${escapeHtml(row.gene)}</div>${row.stats.map(item=>`<div class="dot-cell" title="${escapeHtml(item.name)} · mean ${item.mean.toFixed(2)} · ${item.percent.toFixed(1)}%"><i class="dot" style="width:${Math.max(4,Math.sqrt(item.percent/100)*28)}px;height:${Math.max(4,Math.sqrt(item.percent/100)*28)}px;background:${gradientColor(item.mean,max)}"></i></div>`).join("")}</div>`).join("");
  content.innerHTML=`<div class="dotplot-wrap"><div class="dotplot"><div class="dot-row" style="--cols:${cols}"><div></div>${headers}</div>${rows}</div></div>`;
}
function renderHeatmap(content) {
  const stats=panelStats(), cols=currentData.annotations.length; const headers=currentData.annotations.map(a=>`<div class="heatmap-cell"><span>${displayLabelHtml(a.name)}</span></div>`).join("");
  const rows=stats.map(row=>{const max=Math.max(.001,...row.stats.map(x=>x.mean));return `<div class="heatmap-cell heatmap-label">${escapeHtml(row.gene)}</div>${row.stats.map(item=>`<div class="heatmap-cell" style="background:${gradientColor(item.mean,max)}" title="${escapeHtml(item.name)}: ${item.mean.toFixed(2)}">${item.mean.toFixed(2)}</div>`).join("")}`;}).join("");
  content.innerHTML=`<div class="heatmap-wrap"><div class="heatmap" style="--cols:${cols}"><div class="heatmap-cell heatmap-label">Gene</div>${headers}${rows}</div></div>`;
}

function openOverlay(gene) { overlayPrimary=gene;document.querySelector("#gene-panel-view").hidden=true;document.querySelector("#overlay-view").hidden=false;const select=document.querySelector("#overlay-partner");select.innerHTML=panelGenes.filter(item=>item!==gene).map(item=>`<option>${escapeHtml(item)}</option>`).join("");renderOverlay(); }
document.querySelector("#close-overlay").addEventListener("click",()=>{document.querySelector("#overlay-view").hidden=true;document.querySelector("#gene-panel-view").hidden=false;renderGenePanel();});
document.querySelector("#overlay-partner").addEventListener("change",renderOverlay);
function renderOverlay() {
  const partner=document.querySelector("#overlay-partner").value;if(!partner)return;document.querySelector("#overlay-title").textContent=`${overlayPrimary} + ${partner} overlap`;
  const grid=document.querySelector("#overlay-grid");grid.innerHTML=`<article class="overlay-tile"><h3>${escapeHtml(overlayPrimary)}</h3><canvas></canvas></article><article class="overlay-tile"><h3>${escapeHtml(partner)}</h3><canvas></canvas></article><article class="overlay-tile"><h3>Coexpression</h3><canvas></canvas></article>`;
  const canvases=grid.querySelectorAll("canvas");new UmapPlot(canvases[0]).set(currentData,{mode:"gene",gene:overlayPrimary,condition:exploreCondition});new UmapPlot(canvases[1]).set(currentData,{mode:"gene",gene:partner,condition:exploreCondition});new UmapPlot(canvases[2]).set(currentData,{mode:"overlay",genes:[overlayPrimary,partner],condition:exploreCondition});
}

async function renderTcrExplorer(id) {
  const explorer=TCR_EXPLORERS[id],data=await loadDataset(explorer.dataset);
  if(currentDatasetId!==id)return;
  currentData=data;
  document.querySelector("#expression-workspace").hidden=true;document.querySelector("#tcr-workspace").hidden=false;
  document.querySelector("#tcr-workspace").classList.toggle("total-tcr",id==="tcr_total");
  document.querySelector("#explore-title").textContent=explorer.title;
  document.querySelector("#explore-tcr-button").hidden=true;
  document.querySelector("#tcr-expression-button").hidden=false;
  document.querySelector("#tcr-expression-button").dataset.datasetLink=explorer.dataset;
  document.querySelector("#explore-description").textContent=explorer.description;
  document.querySelector("#breadcrumb-tail").textContent=`› T cells › ${explorer.title}`;
  document.querySelector("#tcr-reference-label").textContent=explorer.label;
  document.querySelector("#tcr-reference-canvas").setAttribute("aria-label",`${explorer.label} UMAP`);
  document.querySelectorAll("#tcr-scope [data-dataset-link]").forEach(button=>{
    const selected=button.dataset.datasetLink===id;
    button.classList.toggle("selected",selected);button.setAttribute("aria-pressed",String(selected));
  });
  document.querySelector("#tcr-scope-note").textContent=id==="tcr_total"
    ? "Descriptive cell-level distributions across two Control and two AIH liver samples. Cells from the same clone or sample are not independent biological replicates. Unexpanded combines Small, Rare, and no TCR detected; missing TCR does not establish biological non-expansion. Medium and Large retain the source cloneSize categories. Clone ranks and counts are calculated within this explorer."
    : "Descriptive cell-level distributions. Cells from the same clone or sample are not independent biological replicates. Unexpanded retains the manuscript grouping, including missing clone-size assignments. Clone ranks and counts are calculated within this explorer.";
  document.querySelector("#tcr-genes").innerHTML=currentData.genes.map(gene=>`<option value="${escapeHtml(gene)}"></option>`).join("");
  if(!currentData.genes.includes(tcrGene))tcrGene=currentData.default_gene;
  document.querySelector("#tcr-gene").value=tcrGene;
  document.querySelector("#tcr-gene").setCustomValidity("");
  renderTcr();
}
document.querySelectorAll("[data-tcr-mode]").forEach(button=>button.addEventListener("click",()=>{
  tcrMode=button.dataset.tcrMode;
  document.querySelectorAll("[data-tcr-mode]").forEach(item=>{item.classList.toggle("selected",item===button);item.setAttribute("aria-pressed",String(item===button));});
  renderTcr();
}));
document.querySelector("#tcr-gene-form").addEventListener("submit",event=>{
  event.preventDefault();
  const input=document.querySelector("#tcr-gene"),gene=validGene(currentData,input.value);
  if(!gene){input.setCustomValidity("Choose one of the 34 genes available in this test preview.");input.reportValidity();return;}
  input.setCustomValidity("");tcrGene=gene;input.value=gene;renderTcrExpression();
});
document.querySelector("#tcr-gene").addEventListener("input",event=>event.target.setCustomValidity(""));
document.querySelector("#tcr-show-points").addEventListener("change",event=>{
  tcrShowPoints=event.target.checked;
  updateTcrPointVisibility();
});

function updateTcrPointVisibility() {
  const chart=document.querySelector("#tcr-violin-chart");
  chart.classList.toggle("hide-individual-points",!tcrShowPoints);
  const description=chart.querySelector("svg desc");
  if(description) description.textContent=`${tcrShowPoints?"Each dot is a cell.":"Individual cell points are hidden."} Black horizontal marks show medians. All cells, including zeros, are included; violin widths are normalized separately.`;
}

function topClones() { return TcrExpression.topClones(currentData); }
function renderTcr() {
  const meta=DATASETS[currentData.id];
  document.querySelector("#tcr-cell-count").textContent=`${comma(currentData.cells.length)} cells · Control + AIH pooled`;
  const top=topClones(),cloneMap=new Map(top.map(([index],rank)=>[index,CLONE_COLORS[rank]]));
  const subsetColors=new Map(currentData.annotations.map((annotation,index)=>[annotation.name,meta.colors[index%meta.colors.length]]));
  tcrReferencePlot.set(currentData,{mode:"annotation",condition:"all",pointScale:TcrExpression.POINT_SCALE,avoidLabelOverlap:currentData.id==="t_cells"});
  tcrPlot.set(currentData,{mode:tcrMode==="expansion"?"expansion":"clones",condition:"all",cloneMap,pointScale:TcrExpression.POINT_SCALE,matchAnnotationLayout:true});
  document.querySelector("#tcr-plot-title").textContent=tcrMode==="expansion"?"Clone size overview":"Top 15 expanded clones";
  const key=document.querySelector("#tcr-key");
  const unexpandedNote=currentData.id==="t_cells"?"Small, Rare, and no TCR detected combined for display; missing TCR does not establish non-expansion.":"Existing manuscript category; includes small, rare, and missing clone-size assignments.";
  if(tcrMode==="expansion") key.innerHTML=TcrExpression.SIZE_ORDER.map(level=>`<span title="${level==="Unexpanded"?unexpandedNote:"Stored manuscript clone-size category."}"><i style="background:${EXPANSION_COLORS[level]}"></i>${escapeHtml(level)}</span>`).join("");
  else key.innerHTML=top.map(([index],rank)=>`<span title="${escapeHtml(currentData.clones[index].id)} · ${escapeHtml(currentData.clones[index].sample)}"><i style="background:${CLONE_COLORS[rank]}"></i>${escapeHtml(currentData.clones[index].id)}</span>`).join("")+"<span><i style='background:#d9ddd9'></i>Other / unassigned</span>";
  document.querySelector("#clone-table-card").hidden=tcrMode!=="clones";
  if(tcrMode==="clones") document.querySelector("#clone-table-body").innerHTML=top.map(([cloneIndex,count],rank)=>{
    const clone=currentData.clones[cloneIndex];
    const subsets=TcrExpression.cloneSubsets(currentData,cloneIndex,meta.subsetOrder||currentData.annotations.map(a=>a.name)).map(name=>`<span style="color:${subsetColors.get(name)}">${displayLabelHtml(name)}</span>`).join(", ");
    return `<tr><td><i class="clone-swatch" style="background:${CLONE_COLORS[rank]}"></i> ${rank+1}</td><td>${escapeHtml(clone.id)}</td><td>${count}</td><td class="clone-subsets">${subsets}</td><td class="sequence">${escapeHtml(clone.cdr3_alpha||"—")}</td><td class="sequence">${escapeHtml(clone.cdr3_beta||"—")}</td></tr>`;
  }).join("");
  renderTcrExpression();
}
function renderTcrExpression() {
  if(!TCR_EXPLORERS[currentDatasetId] || currentData?.id!==TCR_EXPLORERS[currentDatasetId].dataset)return;
  const groups=TcrExpression.groups(currentData,tcrGene,tcrMode),chart=document.querySelector("#tcr-violin-chart");
  document.querySelector("#tcr-violin-title").textContent=tcrGene;
  document.querySelector("#tcr-violin-grouping").textContent=tcrMode==="expansion"?"By clone size":"By clone identity";
  chart.innerHTML=TcrExpression.svg(groups,tcrGene,chart.clientWidth,chart.clientHeight||420);
  updateTcrPointVisibility();
  chart.scrollLeft=0;
  document.querySelector("#tcr-scroll-hint").hidden=tcrMode!=="clones";
  document.querySelector("#tcr-expression-summary").innerHTML=groups.map(group=>{const stat=TcrExpression.summary(group.values);return `<tr><th scope="row">${escapeHtml(group.name)}</th><td>${stat.n}</td><td>${stat.median.toFixed(2)}</td><td>${stat.mean.toFixed(2)}</td><td>${stat.percent.toFixed(1)}%</td></tr>`;}).join("");
}
let tcrResizeFrame;
new ResizeObserver(()=>{cancelAnimationFrame(tcrResizeFrame);tcrResizeFrame=requestAnimationFrame(renderTcrExpression);}).observe(document.querySelector("#tcr-violin-chart"));

let atlasStarted=false;
function startAtlas() {
  if(atlasStarted)return;
  atlasStarted=true;
  initOverview();
  const initialHash=location.hash.replace("#","");if(initialHash==="explore")goDataset("liver_broad");else if(["study","methods"].includes(initialHash))showView(initialHash,false);else showView("overview",false);
}

const ACCESS_PASSWORD_HASH="8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92";
async function sha256(value) {
  const bytes=new TextEncoder().encode(value);
  const digest=await crypto.subtle.digest("SHA-256",bytes);
  return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,"0")).join("");
}
function revealAtlas() {
  sessionStorage.setItem("aih-atlas-access","granted");
  document.body.classList.remove("site-locked");
  document.querySelector("#access-gate").hidden=true;
  startAtlas();
}
document.querySelector("#access-form").addEventListener("submit",async event=>{
  event.preventDefault();
  const input=document.querySelector("#access-password"),error=document.querySelector("#access-error");
  if(await sha256(input.value)===ACCESS_PASSWORD_HASH){input.setAttribute("aria-invalid","false");revealAtlas();return;}
  input.setAttribute("aria-invalid","true");input.value="";error.hidden=false;input.focus();
});
if(sessionStorage.getItem("aih-atlas-access")==="granted")revealAtlas();
