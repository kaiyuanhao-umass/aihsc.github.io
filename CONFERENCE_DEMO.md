# Conference demo

Public link: https://kaiyuanhao-umass.github.io/aihsc.github.io/demo/

The dedicated demo entry opens without a password or an existing browser
session. The original preview entry keeps its existing access flow. Both
entries share the current expression/TCR explorer code and 130-gene data.
The public page is marked as a testing version.

## Gene coverage

`demo-genes.json` is the ordered export manifest. Its panels retain provenance:

- Activated CD8 heatmap: 32 genes.
- Inflammatory/myeloid heatmap: 41 genes.
- Myeloid dot plot: 37 genes.
- Explicit additions: Nr4a1, Nr4a2, Nr4a3, Dgkh, Nkg7, Klrb1c, Il6, Ccl2, Ccl5.
- All 34 genes from the preceding atlas are retained.

The figures contain 107 unique genes. Deduplicating them with the additions
and prior atlas panel gives 130 genes. All 130 are present in the frozen
normalized RNA matrices for all four datasets. No aliases or zero-filled
substitutions were needed. The small dot-plot label is **Id3**, confirmed in
the user's source plotting script; the source script's extra genes that do
not appear in the attached figures were not added.

This release adds expression columns only. Source objects, cell membership,
UMAPs, annotations, condition labels, clone assignments, sequences and clone
sizes remain unchanged. Gene-level displays remain descriptive, with the
existing analysis and normalization conventions.

## Regeneration

1. Run `Rscript export_web_fixtures.R --genes-only`. This reads the existing
   validated fixtures and frozen expression matrices. It checks cell counts,
   coordinates, annotations, genotypes and every previous gene value before
   writing the expanded expression columns. It preserves the first six cell
   columns, annotation records and full clone records. Missing requested genes
   stop the export. For a full rebuild, omit `--genes-only` to revalidate TCR
   records against the source RDS files.
2. Run `python3 build_conference_demo.py` with Pillow and ReportLab available.
   This builds `dist/demo/index.html` from the preview template, the gene TSV,
   and the QR assets. The QR directly encodes the stable public link above;
   it has a four-module quiet zone and high error correction, with no external
   QR service or expiring redirect. PNG: 1568 × 1568 pixels. SVG: vector.
3. Run the Node checks in `tests/conference-demo.test.cjs`,
   `tests/tcr-expression.test.cjs`, and `tests/total-tcr.test.cjs`. They cover
   public startup without a stored session, preview access, relative asset
   paths from `/demo/`, all 130 gene searches in all four datasets, numeric
   expression rows, and TCR grouping with all values including zeros.

The PNG QR was independently decoded with macOS Vision. Data exports were
compared against the previous commit for every cell and existing gene value.
Live browser inspection was unavailable; application/data checks and HTTP
verification of the deployed files were used instead.

## Conference files

- `dist/demo/qr-code.png`: high-resolution bitmap for slides and posters.
- `dist/demo/qr-code.svg`: scalable vector version.
- `dist/demo/gene-list.tsv`: all 130 genes with their panel provenance.
- `dist/demo/demo-url.txt`: the stable public URL.

Publishing remains the existing GitHub Pages workflow deploying `dist/`.
