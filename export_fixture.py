#!/usr/bin/env python3

from __future__ import annotations

import json
from pathlib import Path

import anndata as ad
import numpy as np


ROOT = Path(__file__).resolve().parent
DATASET = ROOT.parent / "portal-data/releases/private-prototype-0.1.0/cd8_activated/dataset.h5ad"
OUTPUT = ROOT / "dist/activated-cd8.json"
GENES = ("Slamf6", "Tox", "Pdcd1", "Klrg1", "P2rx7", "Gzma")


adata = ad.read_h5ad(DATASET)
umap = adata.obsm["X_umap"]
gene_indices = [adata.var_names.get_loc(gene) for gene in GENES]
expression = adata.X[:, gene_indices].toarray().astype(np.float32)

records = []
for index, cell_id in enumerate(adata.obs_names):
    obs = adata.obs.iloc[index]
    records.append(
        [
            str(cell_id),
            round(float(umap[index, 0]), 4),
            round(float(umap[index, 1]), 4),
            str(obs["annotation"]),
            str(obs["genotype"]),
            str(obs["sample_source"]),
            str(obs["expansion_class"]) if not bool(obs.isna()["expansion_class"]) else "Not assigned",
            *[round(float(value), 4) for value in expression[index]],
        ]
    )

payload = {
    "release": "private-prototype-0.1.0",
    "dataset": "Activated CD8 T cells",
    "assay": "RNA",
    "layer": "data",
    "genes": list(GENES),
    "columns": [
        "cell_id",
        "umap_1",
        "umap_2",
        "annotation",
        "genotype",
        "sample",
        "expansion_class",
        *GENES,
    ],
    "cells": records,
}
OUTPUT.write_text(json.dumps(payload, separators=(",", ":")) + "\n")
print(f"WROTE\t{OUTPUT}")
print(f"CELLS\t{len(records)}")
print(f"GENES\t{' | '.join(GENES)}")
