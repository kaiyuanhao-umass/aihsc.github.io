#!/usr/bin/env Rscript

suppressPackageStartupMessages({
  library(data.table)
  library(jsonlite)
  library(rhdf5)
})

script_arg <- commandArgs(trailingOnly = FALSE)[grep("^--file=", commandArgs(trailingOnly = FALSE))][[1]]
script_path <- sub("^--file=", "", script_arg)
site_root <- dirname(normalizePath(script_path, mustWork = TRUE))
workspace_root <- dirname(site_root)
release_root <- file.path(workspace_root, "portal-data", "releases", "private-prototype-0.1.0")
output_root <- file.path(site_root, "dist", "data")
dir.create(output_root, recursive = TRUE, showWarnings = FALSE)

genes_requested <- c(
  "Ptprc", "Cd3d", "Cd3e", "Cd8a", "Cd4", "Nkg7", "Ms4a1", "Lyz2",
  "Adgre1", "Ccr2", "Ly6c2", "S100a8", "S100a9", "Xcr1", "Clec4f",
  "Marco", "Slamf9", "Ifng", "Tox", "Pdcd1", "Gzmk", "Klrg1", "Cxcr6",
  "Slamf6", "Gzmb", "Il7r", "Foxp3", "Tcf7", "Cxcl10", "Isg15", "Stat1",
  "Tnf", "Il27", "Il27ra"
)

dataset_info <- list(
  liver_broad = list(title = "All liver immune cells", default_gene = "Ptprc"),
  monomac = list(title = "Monocytes & Macrophages", default_gene = "Ccr2"),
  t_cells = list(title = "T-cell expression atlas", default_gene = "Tox"),
  cd8_activated = list(title = "Activated CD8 T cells", default_gene = "Tox")
)

read_sparse_columns <- function(path, requested) {
  var_names <- h5read(path, "var_names")
  genes <- requested[requested %in% var_names]
  indptr <- as.numeric(h5read(path, "X/indptr"))
  shape <- as.integer(h5read(path, "X/shape"))
  result <- matrix(0, nrow = shape[[1]], ncol = length(genes))
  colnames(result) <- genes
  for (column in seq_along(genes)) {
    gene_index <- match(genes[[column]], var_names)
    start <- indptr[[gene_index]] + 1
    end <- indptr[[gene_index + 1]]
    if (end >= start) {
      rows <- as.integer(h5read(path, "X/indices", index = list(start:end))) + 1L
      values <- as.numeric(h5read(path, "X/data", index = list(start:end)))
      result[rows, column] <- values
    }
  }
  result
}

split_cdr3 <- function(value, chain) {
  if (is.na(value) || !nzchar(value)) return(NA_character_)
  pieces <- strsplit(value, ";", fixed = TRUE)[[1]]
  hits <- pieces[startsWith(pieces, paste0(chain, ":"))]
  if (!length(hits)) return(NA_character_)
  paste(sub(paste0("^", chain, ":"), "", hits), collapse = "; ")
}

make_tcr_payload <- function(cells) {
  source_path <- "/Users/macbookair/Desktop/DKO scRNAseq/DKOvsHET_ActivatedCD8T_KEEP UMAP.rds"
  object <- readRDS(source_path)
  metadata <- object@meta.data
  keep <- as.character(metadata$group) %in% c("HET_Liver", "DKO_Liver")
  source_ids <- sort(rownames(metadata)[keep])
  metadata <- metadata[source_ids, , drop = FALSE]
  stopifnot(nrow(metadata) == nrow(cells))

  sequence_key <- as.character(metadata$CTaa)
  sequence_key[is.na(sequence_key) | !nzchar(sequence_key)] <- NA_character_
  sample_id <- as.character(metadata$sample)
  clone_key <- ifelse(is.na(sequence_key), NA_character_, paste(sample_id, sequence_key, sep = "::"))
  valid_keys <- clone_key[!is.na(clone_key)]
  totals <- sort(table(valid_keys), decreasing = TRUE)
  ordered_keys <- names(totals)
  clone_index <- match(clone_key, ordered_keys) - 1L
  clone_index[is.na(clone_index)] <- -1L

  clones <- lapply(seq_along(ordered_keys), function(index) {
    key <- ordered_keys[[index]]
    row <- which(clone_key == key)[[1]]
    raw_cdr3 <- as.character(metadata$t_cdr3s_aa[[row]])
    list(
      id = sprintf("Clone %03d", index),
      sample = sample_id[[row]],
      genotype = as.character(cells$genotype[[row]]),
      cells = unname(as.integer(totals[[key]])),
      cdr3_alpha = split_cdr3(raw_cdr3, "TRA"),
      cdr3_beta = split_cdr3(raw_cdr3, "TRB")
    )
  })
  list(clone_index = clone_index, clones = clones)
}

for (dataset_id in names(dataset_info)) {
  dataset_dir <- file.path(release_root, dataset_id)
  cells <- fread(file.path(dataset_dir, "cells.csv.gz"))
  expression <- read_sparse_columns(file.path(dataset_dir, "expression-csc.h5"), genes_requested)
  stopifnot(nrow(cells) == nrow(expression))

  annotations <- unique(as.character(cells$annotation))
  annotation_index <- match(cells$annotation, annotations) - 1L
  genotype_index <- ifelse(cells$genotype == "DKO", 1L, 0L)
  expansion_values <- as.character(cells$expansion_class)
  expansion_values[is.na(expansion_values) | !nzchar(expansion_values)] <- "No TCR detected"
  expansion_levels <- unique(expansion_values)
  expansion_index <- match(expansion_values, expansion_levels) - 1L

  tcr <- NULL
  clone_index <- rep(-1L, nrow(cells))
  if (dataset_id == "cd8_activated") {
    tcr <- make_tcr_payload(cells)
    clone_index <- tcr$clone_index
  }

  annotation_records <- lapply(seq_along(annotations), function(index) {
    mask <- cells$annotation == annotations[[index]]
    list(
      name = annotations[[index]],
      x = round(median(cells$umap_1[mask]), 3),
      y = round(median(cells$umap_2[mask]), 3),
      cells = sum(mask),
      control = sum(mask & cells$genotype == "HET"),
      aih = sum(mask & cells$genotype == "DKO")
    )
  })

  rows <- vector("list", nrow(cells))
  for (index in seq_len(nrow(cells))) {
    rows[[index]] <- c(
      round(cells$umap_1[[index]], 3),
      round(cells$umap_2[[index]], 3),
      annotation_index[[index]],
      genotype_index[[index]],
      expansion_index[[index]],
      clone_index[[index]],
      round(expression[index, ], 3)
    )
  }

  payload <- list(
    release = "private-prototype-0.1.0",
    id = dataset_id,
    title = dataset_info[[dataset_id]]$title,
    total_cells = nrow(cells),
    default_gene = dataset_info[[dataset_id]]$default_gene,
    genes = colnames(expression),
    annotations = annotation_records,
    expansion_levels = expansion_levels,
    columns = c("umap_1", "umap_2", "annotation", "genotype", "expansion", "clone", colnames(expression)),
    cells = rows
  )
  if (!is.null(tcr)) payload$clones <- tcr$clones

  output_path <- file.path(output_root, paste0(dataset_id, ".json"))
  write_json(payload, output_path, auto_unbox = TRUE, na = "null", digits = NA, pretty = FALSE)
  cat(sprintf("WROTE\t%s\t%d cells\t%d genes\n", output_path, nrow(cells), ncol(expression)))
}
