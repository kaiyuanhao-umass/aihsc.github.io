# TCR explorer data

The Total T-cell TCR explorer uses `dist/data/t_cells.json`; the existing
activated CD8 explorer uses `dist/data/cd8_activated.json`. Both preserve the
frozen source UMAPs and the 34 normalized RNA test genes. The total T-cell
export contains only HET_Liver and DKO_Liver cells, matching the expression
atlas: 25,952 cells across HET1, HET2, DKO1, and DKO2.

## Definitions

- The total T-cell display combines source `GZMK+ CD8+ Tex` and
  `KLRG1+ CD8+ Teff` as `Activated CD8+ T cells`: 3,683 liver cells
  (136 HET and 3,547 DKO). Both expression summaries and total TCR clone
  subset lists use this union. Source annotations remain unchanged; the
  exporter validates them before writing the combined display indices.
- Total T-cell colors follow `tcell.colors` in the manuscript's `DKO T cells.R`.
  Source identities confirm ITGA1+ CD4 maps to Activated CD4 I and CD40LG+
  CD4 maps to Activated CD4 II. These manuscript names are display labels.
  The existing activated CD8 explorer retains its five detailed subsets.
- Clone identity is biological sample plus the source `CTaa` amino-acid key.
  Identical sequences in different samples remain separate clones. CDR3α/β
  strings are extracted from `t_cdr3s_aa`; missing chains remain missing.
- Clone counts and top-15 ranks are recalculated within each explorer's cell
  population. A display name such as Clone 001 is local to that explorer.
- Total T-cell expansion uses the existing `cloneSize` labels, without
  recomputing relative frequencies or thresholds. Small, Rare, None, and
  missing assignments/no detected TCR map to Unexpanded. Medium and Large
  retain their source labels. Unexpected categories stop the export for review.
- In this liver subset: Unexpanded 23,998 (21,182 Small + 2,816 missing TCR),
  Medium 1,557, and Large 397. There are no observed Rare, None, or
  Hyperexpanded cells. There are 23,136 TCR-assigned cells and 20,137
  sample-specific clones.
- Violin densities, medians, and summaries include all cells and zeros.
  Showing/hiding points only affects display. Grouping by clone keeps
  non-top clones and cells without a TCR assignment in separate groups.
- These are descriptive pooled-cell views, not independent-replicate
  significance tests. Unexpanded is a display grouping; missing TCR is not
  evidence of biological non-expansion.

## Regeneration and checks

Run `Rscript export_web_fixtures.R t_cells` from this repository. The exporter
reads the frozen release manifest to locate the RDS and validates each row's
group, sample, annotation, and UMAP coordinates before attaching clone data.
It checks that CTaa presence agrees with t_cdr3s_aa and the release's TCR flag.
The source RDS and frozen release are read-only inputs. An optional dataset
argument limits output to that dataset; omitting it rebuilds all fixtures.

Run `node tests/tcr-expression.test.cjs` for activated CD8 regression checks
and `node tests/total-tcr.test.cjs` for total T-cell counts, clone membership,
subsets, and the 34-gene distributions in both grouping modes.

For the initial extension, every original T-cell coordinate, annotation,
genotype, and normalized gene value was compared with the preceding website
fixture and found unchanged. Source metadata validated all 25,952 row
associations. The existing activated CD8 JSON was not regenerated.

The November 10 annotation update was also compared cell-by-cell with the
preceding fixture: only the requested annotation union changed. All cell
coordinates, genotypes, expression values, clone-size assignments and clone
records were identical. The combined label anchor is the coordinate-wise
median of its source cells.

`node tests/t-cell-atlas.test.cjs` checks the merged counts, manuscript
palette, label/point separation, label/label separation, bounds and paired
UMAP alignment at several viewport sizes and in all condition filters.
Label placement measures text and searches unoccupied space with a buffer
around every dot; only uniform scale/translation vary with panel size.
