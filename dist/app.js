const DATASET_DETAILS = {
  broad: {index:"01", status:"Validated dataset", title:"Broad liver atlas", copy:"The primary entry point: 63,936 liver cells across nine current broad annotations.", live:false},
  monomac: {index:"02", status:"Validated dataset", title:"MonoMacs", copy:"An exact high-resolution subset of the broad atlas covering six current monocyte and macrophage annotations.", live:false},
  tcells: {index:"03", status:"Validated dataset", title:"Total T cells", copy:"An independently reprocessed liver T-cell atlas containing CD4, CD8, regulatory, proliferating, and γδ states.", live:false},
  cd8: {index:"04", status:"Validated dataset", title:"Total CD8 T cells", copy:"An exact T-cell subset focused on naïve, GZMK-positive exhausted, and KLRG1-positive effector CD8 states.", live:false},
  activated: {index:"05", status:"Live explorer", title:"Activated CD8 T cells", copy:"A focused view of stem-like, intermediate, effector, terminal, and tissue-resident memory-like activated CD8 states.", live:true}
};

const STATE_COLORS = {"Stem-like":"#9bcf8d", "Intermediate":"#4f9a68", "Teff":"#d7a33d", "Terminal":"#8f7d45", "Trm":"#c4a8bc"};
const GENOTYPE_COLORS = {DKO:"#187f82", HET:"#dadbd4"};
const GENE_COLORS = ["#e5e8e3", "#dec3aa", "#c7775c", "#792f59"];
const canvas = document.querySelector("#umap-canvas");
const ctx = canvas.getContext("2d");
const tooltip = document.querySelector("#tooltip");
let atlas = null;
let points = [];
let currentColor = "annotation";
let currentGene = "Slamf6";
let currentGenotype = "All";
let layout = null;

document.querySelectorAll(".atlas-node").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll(".atlas-node").forEach(node => node.classList.toggle("active", node === button));
  const detail = DATASET_DETAILS[button.dataset.dataset];
  document.querySelector(".detail-index").textContent = detail.index;
  document.querySelector(".detail-status").textContent = detail.status;
  document.querySelector("#detail-title").textContent = detail.title;
  document.querySelector("#detail-copy").textContent = detail.copy;
  const action = document.querySelector("#detail-action");
  action.textContent = detail.live ? "Open this explorer →" : "Full explorer integration pending";
  action.href = detail.live ? "#explore" : "#datasets";
}));

document.querySelectorAll("[data-genotype]").forEach(button => button.addEventListener("click", () => {
  currentGenotype = button.dataset.genotype;
  document.querySelectorAll("[data-genotype]").forEach(item => item.classList.toggle("selected", item === button));
  render();
}));

document.querySelector("#color-select").addEventListener("change", event => {
  currentColor = event.target.value;
  render();
});

document.querySelector("#gene-select").addEventListener("change", event => {
  currentGene = event.target.value;
  render();
});

function hexToRgb(hex) {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function interpolateColor(value, max) {
  if (!max || value <= 0) return GENE_COLORS[0];
  const scaled = Math.min(1, value / max) * (GENE_COLORS.length - 1);
  const index = Math.min(GENE_COLORS.length - 2, Math.floor(scaled));
  const fraction = scaled - index;
  const start = hexToRgb(GENE_COLORS[index]);
  const end = hexToRgb(GENE_COLORS[index + 1]);
  return `rgb(${start.map((channel, i) => Math.round(channel + (end[i] - channel) * fraction)).join(",")})`;
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return rect;
}

function render() {
  if (!atlas) return;
  const rect = resizeCanvas();
  const visible = points.filter(point => currentGenotype === "All" || point.genotype === currentGenotype);
  const pad = 42;
  const xs = points.map(point => point.x), ys = points.map(point => point.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const scale = Math.min((rect.width - pad * 2) / (maxX - minX), (rect.height - pad * 2) / (maxY - minY));
  const plotWidth = (maxX - minX) * scale, plotHeight = (maxY - minY) * scale;
  const offsetX = (rect.width - plotWidth) / 2, offsetY = (rect.height - plotHeight) / 2;
  const geneMax = currentColor === "gene" ? Math.max(...visible.map(point => point.genes[currentGene])) : 0;
  ctx.clearRect(0, 0, rect.width, rect.height);
  visible.forEach(point => {
    point.sx = offsetX + (point.x - minX) * scale;
    point.sy = rect.height - (offsetY + (point.y - minY) * scale);
    const color = currentColor === "annotation" ? STATE_COLORS[point.annotation] : currentColor === "genotype" ? GENOTYPE_COLORS[point.genotype] : interpolateColor(point.genes[currentGene], geneMax);
    ctx.beginPath(); ctx.arc(point.sx, point.sy, currentColor === "gene" ? 2.15 : 2.25, 0, Math.PI * 2); ctx.fillStyle = color; ctx.globalAlpha = currentColor === "gene" && point.genes[currentGene] === 0 ? .38 : .82; ctx.fill();
  });
  ctx.globalAlpha = 1;
  layout = {visible, geneMax};
  document.querySelector("#visible-count").textContent = `${visible.length.toLocaleString()} cells`;
  document.querySelector("#plot-title").textContent = currentColor === "annotation" ? "Colored by cell state" : currentColor === "genotype" ? "Colored by genotype" : `Expression of ${currentGene}`;
  updateLegend(visible, geneMax);
  updateSummary();
}

function updateLegend(visible, geneMax) {
  const legend = document.querySelector("#legend");
  legend.innerHTML = "";
  if (currentColor === "gene") {
    document.querySelector("#legend-title").textContent = `${currentGene} expression`;
    legend.innerHTML = `<div class="gradient"></div><div class="gradient-labels"><span>0</span><span>${geneMax.toFixed(2)}</span></div><p class="prototype-note" style="margin-top:1rem">Normalized expression · scale is specific to this gene.</p>`;
    return;
  }
  const field = currentColor;
  document.querySelector("#legend-title").textContent = field === "annotation" ? "Cell state" : "Genotype";
  const colors = field === "annotation" ? STATE_COLORS : GENOTYPE_COLORS;
  Object.keys(colors).forEach(value => {
    const count = visible.filter(point => point[field] === value).length;
    legend.insertAdjacentHTML("beforeend", `<div class="legend-row"><span class="legend-swatch" style="background:${colors[value]}"></span><span>${value}</span><small>${count.toLocaleString()}</small></div>`);
  });
}

function updateSummary() {
  if (!atlas) return;
  const chart = document.querySelector("#expression-bars");
  const groups = Object.keys(STATE_COLORS).map(annotation => {
    const cells = points.filter(point => point.annotation === annotation && (currentGenotype === "All" || point.genotype === currentGenotype));
    const mean = cells.length ? cells.reduce((sum, point) => sum + point.genes[currentGene], 0) / cells.length : 0;
    return {annotation, mean};
  });
  const max = Math.max(...groups.map(group => group.mean), .0001);
  chart.innerHTML = groups.map(group => `<div class="bar-row"><span>${group.annotation}</span><div class="bar-track"><div class="bar-fill" style="width:${group.mean / max * 100}%"></div></div><span class="bar-value">${group.mean.toFixed(2)}</span></div>`).join("");
  document.querySelector("#summary-title").textContent = `${currentGene} by cell state`;
}

canvas.addEventListener("mousemove", event => {
  if (!layout) return;
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left, y = event.clientY - rect.top;
  let nearest = null, distance = 70;
  for (const point of layout.visible) {
    const candidate = (point.sx - x) ** 2 + (point.sy - y) ** 2;
    if (candidate < distance) { distance = candidate; nearest = point; }
  }
  if (!nearest) { tooltip.hidden = true; return; }
  tooltip.hidden = false;
  tooltip.style.left = `${Math.min(rect.width - 190, x + 14)}px`;
  tooltip.style.top = `${Math.max(8, y - 74)}px`;
  tooltip.innerHTML = `<strong>${nearest.annotation}</strong><span>${nearest.genotype} · ${nearest.sample}</span><span>${currentGene}: ${nearest.genes[currentGene].toFixed(3)}</span><span>${nearest.id}</span>`;
});
canvas.addEventListener("mouseleave", () => tooltip.hidden = true);
window.addEventListener("resize", () => requestAnimationFrame(render));

fetch("activated-cd8.json").then(response => {
  if (!response.ok) throw new Error("Could not load activated-CD8 fixture");
  return response.json();
}).then(data => {
  atlas = data;
  const geneStart = 7;
  points = data.cells.map(row => ({id:row[0], x:row[1], y:row[2], annotation:row[3], genotype:row[4], sample:row[5], expansion:row[6], genes:Object.fromEntries(data.genes.map((gene, index) => [gene, row[geneStart + index]]))}));
  const selector = document.querySelector("#gene-select");
  selector.innerHTML = data.genes.map(gene => `<option>${gene}</option>`).join("");
  render();
}).catch(error => {
  document.querySelector(".canvas-wrap").innerHTML = `<p style="padding:2rem;color:#8b3f3f">${error.message}</p>`;
});
