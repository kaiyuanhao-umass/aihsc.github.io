#!/usr/bin/env python3
"""Build the public demo entry, gene list and print-ready QR assets.

Uses the existing preview HTML and shared assets. Requires Pillow and
ReportLab for QR generation; no online QR service or tracking redirect.
"""
from pathlib import Path
import csv
import json
import re

from PIL import Image, ImageDraw
from reportlab.graphics.barcode import qrencoder

ROOT = Path(__file__).resolve().parent
DEMO_URL = "https://kaiyuanhao-umass.github.io/aihsc.github.io/demo/"
OUTPUT = ROOT / "dist" / "demo"
OUTPUT.mkdir(parents=True, exist_ok=True)
panel = json.loads((ROOT / "demo-genes.json").read_text())
count = len(panel["genes"])
html = (ROOT / "dist" / "index.html").read_text()
html, removed = re.subn(r'    <section class="access-gate".*?</section>\n', '', html, count=1, flags=re.S)
assert removed == 1, "Expected exactly one preview password gate"

replacements = {
    '<body class="site-locked">': '<body data-public-demo="true">',
    '<title>Autoimmune Hepatitis Mouse Model Liver Immune Cell Atlas</title>': '<title>AIH Liver Immune Cell Atlas · Conference Demo</title>',
    'href="styles.css?': 'href="../styles.css?',
    'src="tcr-expression.js?': 'src="../tcr-expression.js?',
    'src="app.js?': 'src="../app.js?',
    '        <span class="private-pill">Private preview</span>\n': '',
    'Private manuscript companion preview': f'Public conference demo · {count} genes',
    'Open the full explorer': 'Explore the demo',
}
for before, after in replacements.items():
    assert before in html, f"Template changed: {before}"
    html = html.replace(before, after)

notice = f'''    <section class="demo-notice" aria-label="Demo version">
      <p>Testing version · {count} selected genes</p>
      <a href="gene-list.tsv" download>Download the gene list</a>
    </section>

'''
html = html.replace('    <main id="main">', notice + '    <main id="main">', 1)
assert 'site-locked' not in html and 'access-password' not in html
assert 'Private' not in html and '34 test genes' not in html
(OUTPUT / 'index.html').write_text(html)

with (OUTPUT / 'gene-list.tsv').open('w', newline='') as handle:
    writer = csv.writer(handle, delimiter='\t', lineterminator='\n')
    writer.writerow(['Gene', 'Requested panel'])
    for gene in sorted(panel['genes'], key=str.casefold):
        sources = [name for name, genes in panel['panels'].items() if gene in genes]
        writer.writerow([gene, '; '.join(sources)])

qr = qrencoder.QRCode(None, qrencoder.QRErrorCorrectLevel.H)
qr.addData(DEMO_URL)
qr.make()
modules, quiet, pixels = qr.getModuleCount(), 4, 32
size = modules + 2 * quiet
image = Image.new('RGB', (size * pixels, size * pixels), 'white')
draw = ImageDraw.Draw(image)
paths = []
for y in range(modules):
    for x in range(modules):
        if not qr.isDark(y, x):
            continue
        left, top = x + quiet, y + quiet
        draw.rectangle((left * pixels, top * pixels, (left + 1) * pixels - 1, (top + 1) * pixels - 1), fill='black')
        paths.append(f'M{left} {top}h1v1h-1z')
image.save(OUTPUT / 'qr-code.png', dpi=(300, 300))
image.resize((size * 8, size * 8), Image.Resampling.NEAREST).save(OUTPUT / 'qr-preview.png')
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{size * pixels}" height="{size * pixels}" viewBox="0 0 {size} {size}" shape-rendering="crispEdges" role="img" aria-labelledby="title desc">
<title id="title">AIH Liver Immune Cell Atlas conference demo</title>
<desc id="desc">Scan to open {DEMO_URL}</desc>
<rect width="{size}" height="{size}" fill="white"/>
<path d="{''.join(paths)}" fill="black"/>
</svg>
'''
(OUTPUT / 'qr-code.svg').write_text(svg)
(OUTPUT / 'demo-url.txt').write_text(DEMO_URL + '\n')
print(f'Built public demo with {count} genes: {DEMO_URL}')
print(f'QR: {modules} modules, high error correction, {size * pixels}px PNG and vector SVG')
